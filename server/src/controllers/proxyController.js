import { z } from 'zod';
import prisma from '../config/db.js';
import { generateTxHash } from './votingController.js';
import { logAudit } from '../utils/auditLogger.js';

export const delegatePowerSchema = z.object({
  proxyUserId: z.string().uuid('Invalid Proxy Representative User ID'),
  proposalId: z.string().uuid().optional().or(z.literal('')),
  delegatedPower: z.number().int().positive('Delegated power must be a positive integer'),
  validUntil: z.string().datetime({ offset: true }).or(z.string()),
});

export const castProxyVoteSchema = z.object({
  delegationId: z.string().uuid('Invalid Delegation Ticket ID'),
  proposalId: z.string().uuid('Invalid Proposal ID'),
  choice: z.enum(['YES', 'NO', 'ABSTAIN']),
});

/**
 * Shareholder delegates voting power to a proxy representative
 */
export const delegatePower = async (req, res, next) => {
  try {
    const { proxyUserId, proposalId, delegatedPower, validUntil } = req.body;
    const delegatorUserId = req.user.id;

    // Prevent self-delegation
    if (proxyUserId === delegatorUserId) {
      return res.status(400).json({ success: false, message: 'You cannot delegate voting power to yourself.' });
    }

    // Verify proxy user exists
    const proxyUser = await prisma.user.findUnique({ where: { id: proxyUserId } });
    if (!proxyUser || !proxyUser.isActive) {
      return res.status(404).json({ success: false, message: 'Proxy representative account not found or inactive.' });
    }

    // Verify delegator shareholder folio
    const shareholder = await prisma.shareholder.findUnique({ where: { userId: delegatorUserId } });
    if (!shareholder || shareholder.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Active shareholder folio required to delegate power.' });
    }

    // Calculate Available Voting Power
    const availablePower = shareholder.votingPower - shareholder.delegatedPowerOut;
    const powerToDelegate = BigInt(delegatedPower);

    if (powerToDelegate > availablePower) {
      return res.status(400).json({
        success: false,
        message: `Requested delegation power (${powerToDelegate}) exceeds currently available power (${availablePower}).`,
      });
    }

    const expiryDate = new Date(validUntil);
    if (expiryDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Delegation expiry date must be in the future.' });
    }

    const onChainTxHash = generateTxHash({ delegatorUserId, proxyUserId, power: powerToDelegate.toString() });

    // Execute atomic transaction: create delegation + increment delegatedPowerOut
    const [delegation, updatedShareholder] = await prisma.$transaction([
      prisma.proxyDelegation.create({
        data: {
          delegatorUserId,
          proxyUserId,
          shareholderId: shareholder.id,
          proposalId: proposalId && proposalId.trim() !== '' ? proposalId : null,
          delegatedPower: powerToDelegate,
          validFrom: new Date(),
          validUntil: expiryDate,
          status: 'ACTIVE',
          onChainTxHash,
        },
        include: {
          proxy: { select: { id: true, fullName: true, email: true } },
          proposal: { select: { id: true, title: true } },
        },
      }),
      prisma.shareholder.update({
        where: { id: shareholder.id },
        data: {
          delegatedPowerOut: { increment: powerToDelegate },
        },
      }),
    ]);

    await logAudit({
      userId: delegatorUserId,
      userRole: req.user.role,
      action: 'PROXY_DELEGATED',
      entity: 'PROXY_DELEGATION',
      entityId: delegation.id,
      status: 'SUCCESS',
      details: {
        proxyName: proxyUser.fullName,
        delegatedPower: powerToDelegate.toString(),
        validUntil: expiryDate.toISOString(),
      },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully delegated ${powerToDelegate} voting power to ${proxyUser.fullName}.`,
      data: {
        delegation: {
          ...delegation,
          delegatedPower: delegation.delegatedPower.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke an active proxy delegation
 */
export const revokeDelegation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const delegation = await prisma.proxyDelegation.findUnique({
      where: { id },
      include: { shareholder: true },
    });

    if (!delegation) {
      return res.status(404).json({ success: false, message: 'Delegation ticket not found.' });
    }

    if (delegation.delegatorUserId !== userId && req.user.role !== 'COMPANY_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to revoke this delegation ticket.' });
    }

    if (delegation.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: `Delegation is already in ${delegation.status} status.` });
    }

    // Atomic transaction: set REVOKED + decrement delegatedPowerOut
    const [updatedDelegation, updatedShareholder] = await prisma.$transaction([
      prisma.proxyDelegation.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      }),
      prisma.shareholder.update({
        where: { id: delegation.shareholderId },
        data: {
          delegatedPowerOut: { decrement: delegation.delegatedPower },
        },
      }),
    ]);

    await logAudit({
      userId,
      userRole: req.user.role,
      action: 'PROXY_REVOKED',
      entity: 'PROXY_DELEGATION',
      entityId: id,
      status: 'SUCCESS',
      details: {
        restoredPower: delegation.delegatedPower.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Proxy delegation revoked and voting power restored to shareholder folio.',
      data: {
        delegation: {
          ...updatedDelegation,
          delegatedPower: updatedDelegation.delegatedPower.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Proxy Representative retrieves all delegated voting authority assigned to them
 */
export const getDelegationsReceived = async (req, res, next) => {
  try {
    const delegations = await prisma.proxyDelegation.findMany({
      where: {
        proxyUserId: req.user.id,
        status: 'ACTIVE',
        validUntil: { gt: new Date() },
      },
      include: {
        delegator: {
          select: { id: true, fullName: true, email: true, walletAddress: true },
        },
        shareholder: {
          select: { folioNumber: true, company: { select: { name: true } } },
        },
        proposal: { select: { id: true, title: true, status: true } },
        votes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = delegations.map((d) => ({
      id: d.id,
      delegator: d.delegator,
      folioNumber: d.shareholder.folioNumber,
      companyName: d.shareholder.company.name,
      delegatedPower: d.delegatedPower.toString(),
      validFrom: d.validFrom,
      validUntil: d.validUntil,
      status: d.status,
      proposal: d.proposal,
      hasVoted: d.votes.length > 0,
    }));

    return res.status(200).json({ success: true, data: { delegations: formatted } });
  } catch (error) {
    next(error);
  }
};

/**
 * Shareholder retrieves all delegations they have created
 */
export const getMyDelegationsGiven = async (req, res, next) => {
  try {
    const delegations = await prisma.proxyDelegation.findMany({
      where: { delegatorUserId: req.user.id },
      include: {
        proxy: { select: { id: true, fullName: true, email: true, walletAddress: true } },
        proposal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = delegations.map((d) => ({
      id: d.id,
      proxy: d.proxy,
      proposal: d.proposal,
      delegatedPower: d.delegatedPower.toString(),
      validFrom: d.validFrom,
      validUntil: d.validUntil,
      status: d.validUntil < new Date() && d.status === 'ACTIVE' ? 'EXPIRED' : d.status,
      onChainTxHash: d.onChainTxHash,
      createdAt: d.createdAt,
    }));

    return res.status(200).json({ success: true, data: { delegations: formatted } });
  } catch (error) {
    next(error);
  }
};

/**
 * Proxy casts a vote using delegated power ticket
 */
export const castProxyVote = async (req, res, next) => {
  try {
    const { delegationId, proposalId, choice } = req.body;
    const proxyUserId = req.user.id;

    // 1. Verify Delegation Ticket
    const delegation = await prisma.proxyDelegation.findUnique({
      where: { id: delegationId },
      include: { delegator: true, shareholder: true },
    });

    if (!delegation) {
      return res.status(404).json({ success: false, message: 'Delegation ticket not found.' });
    }

    if (delegation.proxyUserId !== proxyUserId) {
      return res.status(403).json({ success: false, message: 'You are not the designated proxy for this ticket.' });
    }

    if (delegation.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: `Delegation ticket is in '${delegation.status}' status.` });
    }

    if (new Date() > new Date(delegation.validUntil)) {
      // Record Anomaly: Expired Proxy Attempt
      await prisma.anomalyAlert.create({
        data: {
          userId: proxyUserId,
          targetEntity: 'VOTE',
          entityId: proposalId,
          reason: 'Attempted to vote using an expired proxy delegation ticket.',
          severity: 'HIGH',
        },
      });

      return res.status(400).json({ success: false, message: 'This proxy delegation ticket has expired.' });
    }

    // 2. Verify Proposal Window
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal || proposal.status !== 'VOTING_OPEN') {
      return res.status(400).json({ success: false, message: 'Proposal is not open for voting.' });
    }

    // 3. Verify No Double Voting with this Ticket on this Proposal
    const existingVote = await prisma.vote.findFirst({
      where: {
        proposalId,
        proxyDelegationId: delegationId,
      },
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'This delegation ticket has already been exercised for this resolution.',
      });
    }

    // 4. Generate Blockchain Proof
    const txHash = generateTxHash({
      proposalId,
      proxyUserId,
      delegatorUserId: delegation.delegatorUserId,
      choice,
      power: delegation.delegatedPower.toString(),
    });
    const blockNumber = BigInt(Math.floor(18000000 + Math.random() * 500000));
    const blockTimestamp = new Date();

    // 5. Atomic Write
    const [vote, updatedProposal] = await prisma.$transaction([
      prisma.vote.create({
        data: {
          proposalId,
          voterUserId: proxyUserId,
          proxyDelegationId: delegationId,
          votingPowerUsed: delegation.delegatedPower,
          choice,
          txHash,
          blockNumber,
          blockTimestamp,
          isVerifiedOnChain: true,
        },
        include: {
          proposal: { select: { title: true } },
          voter: { select: { fullName: true } },
        },
      }),
      prisma.proposal.update({
        where: { id: proposalId },
        data: {
          ...(choice === 'YES' && { totalYesVotes: { increment: delegation.delegatedPower } }),
          ...(choice === 'NO' && { totalNoVotes: { increment: delegation.delegatedPower } }),
          ...(choice === 'ABSTAIN' && { totalAbstainVotes: { increment: delegation.delegatedPower } }),
        },
      }),
    ]);

    await logAudit({
      userId: proxyUserId,
      userRole: req.user.role,
      action: 'VOTE_CAST_PROXY',
      entity: 'VOTE',
      entityId: vote.id,
      status: 'SUCCESS',
      details: {
        proposalTitle: proposal.title,
        principal: delegation.delegator.fullName,
        votingPowerUsed: delegation.delegatedPower.toString(),
        txHash,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Proxy vote of ${delegation.delegatedPower} votes recorded on behalf of ${delegation.delegator.fullName}.`,
      data: {
        receipt: {
          voteId: vote.id,
          proposalTitle: proposal.title,
          choice: vote.choice,
          votingPowerUsed: vote.votingPowerUsed.toString(),
          principal: delegation.delegator.fullName,
          proxy: vote.voter.fullName,
          txHash: vote.txHash,
          blockNumber: vote.blockNumber.toString(),
          blockTimestamp: vote.blockTimestamp,
          isVerifiedOnChain: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
