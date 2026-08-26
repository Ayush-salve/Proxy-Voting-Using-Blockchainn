import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export const createProxySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  walletAddress: z.string().optional().or(z.literal('')),
});

export const approveRequestSchema = z.object({
  totalShares: z.number().int().nonnegative().optional(),
  votingPower: z.number().int().nonnegative().optional(),
  customFolioNumber: z.string().optional(),
});

export const rejectRequestSchema = z.object({
  reason: z.string().optional(),
});

/**
 * List all pending registration approval requests
 */
export const listPendingRegistrationRequests = async (req, res, next) => {
  try {
    const requests = await prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        walletAddress: true,
        requestedShares: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = requests.map((r) => ({
      ...r,
      requestedShares: r.requestedShares ? r.requestedShares.toString() : '1000',
    }));

    return res.status(200).json({ success: true, data: { requests: formatted } });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a user's registration request into the governance network.
 * Automatically generates Folio Number & Wallet Address (if missing) and allocates Shares & Voting Power.
 */
export const approveRegistrationRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { totalShares = 1000, votingPower, customFolioNumber } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Registration request not found.' });
    }

    if (user.approvalStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Account is already in '${user.approvalStatus}' status.`,
      });
    }

    // Auto-generate Ethereum Wallet Address if not set
    const walletAddress = user.walletAddress || `0x${crypto.randomBytes(20).toString('hex')}`;

    // Get Default Company
    const company = await prisma.company.findFirst();
    if (!company) {
      return res.status(500).json({ success: false, message: 'No active governance company found.' });
    }

    // Generate unique Folio Number if Shareholder
    let folioNumber = customFolioNumber;
    if (!folioNumber && user.role === 'SHAREHOLDER') {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      folioNumber = `FOLIO-APX-${randomSuffix}`;
    }

    const assignedVotingPower = votingPower !== undefined ? BigInt(votingPower) : BigInt(totalShares);

    // Atomic transaction: Update User + Create Shareholder Folio if Shareholder
    const [updatedUser] = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          isActive: true,
          walletAddress,
        },
      });

      if (user.role === 'SHAREHOLDER' && folioNumber) {
        await tx.shareholder.create({
          data: {
            userId: id,
            companyId: company.id,
            folioNumber,
            totalShares: BigInt(totalShares),
            votingPower: assignedVotingPower,
            status: 'ACTIVE',
          },
        });
      }

      // Mark any matching anomaly alert as resolved
      await tx.anomalyAlert.updateMany({
        where: { entityId: id, targetEntity: 'REGISTRATION_APPROVAL' },
        data: { isResolved: true },
      });

      return [u];
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'REGISTRATION_APPROVED',
      entity: 'USER',
      entityId: id,
      status: 'SUCCESS',
      details: {
        approvedUserName: user.fullName,
        role: user.role,
        folioNumber,
        allocatedShares: totalShares.toString(),
        votingPower: assignedVotingPower.toString(),
        walletAddress,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User ${user.fullName} approved successfully! Folio and wallet address assigned.`,
      data: {
        user: updatedUser,
        folioNumber,
        walletAddress,
        totalShares: totalShares.toString(),
        votingPower: assignedVotingPower.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a user's registration request
 */
export const rejectRegistrationRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Registration details did not meet governance verification standards.' } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Registration request not found.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        isActive: false,
        rejectionReason: reason,
      },
    });

    // Mark alert as resolved
    await prisma.anomalyAlert.updateMany({
      where: { entityId: id, targetEntity: 'REGISTRATION_APPROVAL' },
      data: { isResolved: true },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'REGISTRATION_REJECTED',
      entity: 'USER',
      entityId: id,
      status: 'SUCCESS',
      details: { rejectedUserName: user.fullName, reason },
    });

    return res.status(200).json({
      success: true,
      message: `Registration request for ${user.fullName} has been rejected.`,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin directly creates a Proxy Representative user
 */
export const createProxyRepresentative = async (req, res, next) => {
  try {
    const { fullName, email, password, walletAddress } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const finalWallet = walletAddress && walletAddress.trim() !== ''
      ? walletAddress.trim()
      : `0x${crypto.randomBytes(20).toString('hex')}`;

    const newProxy = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'PROXY_REPRESENTATIVE',
        walletAddress: finalWallet,
        isActive: true,
        approvalStatus: 'APPROVED',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        walletAddress: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'PROXY_REPRESENTATIVE_CREATED_BY_ADMIN',
      entity: 'USER',
      entityId: newProxy.id,
      status: 'SUCCESS',
      details: { proxyName: newProxy.fullName, email: newProxy.email },
    });

    return res.status(201).json({
      success: true,
      message: `Proxy Representative ${newProxy.fullName} created successfully.`,
      data: { proxy: newProxy },
    });
  } catch (error) {
    next(error);
  }
};
