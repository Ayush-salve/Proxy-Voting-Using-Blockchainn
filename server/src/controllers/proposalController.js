import { z } from 'zod';
import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export const createProposalSchema = z.object({
  meetingId: z.string().uuid('Invalid Meeting ID'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description is required'),
  category: z.string().min(2, 'Category is required'),
  startTime: z.string().datetime({ offset: true }).or(z.string()),
  endTime: z.string().datetime({ offset: true }).or(z.string()),
  documentUrl: z.string().optional(),
});

export const updateProposalStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'VOTING_OPEN', 'VOTING_CLOSED', 'RESULT_PUBLISHED']),
});

export const listProposals = async (req, res, next) => {
  try {
    const { status, meetingId, category } = req.query;

    const proposals = await prisma.proposal.findMany({
      where: {
        ...(status && { status }),
        ...(meetingId && { meetingId }),
        ...(category && { category }),
      },
      include: {
        meeting: {
          select: { id: true, title: true, meetingType: true, company: { select: { name: true } } },
        },
        aiSummary: true,
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = proposals.map((p) => ({
      ...p,
      totalYesVotes: p.totalYesVotes.toString(),
      totalNoVotes: p.totalNoVotes.toString(),
      totalAbstainVotes: p.totalAbstainVotes.toString(),
      aiSummary: p.aiSummary
        ? {
            ...p.aiSummary,
            keyPoints: typeof p.aiSummary.keyPoints === 'string' ? JSON.parse(p.aiSummary.keyPoints) : p.aiSummary.keyPoints,
            importantDates: typeof p.aiSummary.importantDates === 'string' ? JSON.parse(p.aiSummary.importantDates) : p.aiSummary.importantDates,
          }
        : null,
    }));

    return res.status(200).json({ success: true, data: { proposals: formatted } });
  } catch (error) {
    next(error);
  }
};

export const getProposalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        meeting: {
          include: { company: true },
        },
        aiSummary: true,
        votes: {
          include: {
            voter: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    // Check if authenticated user has already voted
    let hasVoted = false;
    let userVoteRecord = null;

    if (req.user) {
      const existingVote = await prisma.vote.findFirst({
        where: {
          proposalId: id,
          voterUserId: req.user.id,
        },
      });
      if (existingVote) {
        hasVoted = true;
        userVoteRecord = {
          ...existingVote,
          votingPowerUsed: existingVote.votingPowerUsed.toString(),
        };
      }
    }

    const formatted = {
      ...proposal,
      totalYesVotes: proposal.totalYesVotes.toString(),
      totalNoVotes: proposal.totalNoVotes.toString(),
      totalAbstainVotes: proposal.totalAbstainVotes.toString(),
      hasVoted,
      userVoteRecord,
      aiSummary: proposal.aiSummary
        ? {
            ...proposal.aiSummary,
            keyPoints: typeof proposal.aiSummary.keyPoints === 'string' ? JSON.parse(proposal.aiSummary.keyPoints) : proposal.aiSummary.keyPoints,
            importantDates: typeof proposal.aiSummary.importantDates === 'string' ? JSON.parse(proposal.aiSummary.importantDates) : proposal.aiSummary.importantDates,
          }
        : null,
      votes: proposal.votes.map((v) => ({
        ...v,
        votingPowerUsed: v.votingPowerUsed.toString(),
      })),
    };

    return res.status(200).json({ success: true, data: { proposal: formatted } });
  } catch (error) {
    next(error);
  }
};

export const createProposal = async (req, res, next) => {
  try {
    const { meetingId, title, description, category, startTime, endTime, documentUrl } = req.body;

    const proposal = await prisma.proposal.create({
      data: {
        meetingId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        documentUrl: documentUrl ? documentUrl.trim() : null,
        status: 'DRAFT',
      },
      include: { meeting: true },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'PROPOSAL_CREATED',
      entity: 'PROPOSAL',
      entityId: proposal.id,
      status: 'SUCCESS',
      details: { title: proposal.title, category: proposal.category },
    });

    return res.status(201).json({
      success: true,
      message: 'Resolution proposal created successfully in Draft status',
      data: {
        proposal: {
          ...proposal,
          totalYesVotes: proposal.totalYesVotes.toString(),
          totalNoVotes: proposal.totalNoVotes.toString(),
          totalAbstainVotes: proposal.totalAbstainVotes.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProposalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'PROPOSAL_STATUS_UPDATED',
      entity: 'PROPOSAL',
      entityId: id,
      status: 'SUCCESS',
      details: { newStatus: status },
    });

    return res.status(200).json({
      success: true,
      message: `Proposal status transitioned to ${status}`,
      data: {
        proposal: {
          ...proposal,
          totalYesVotes: proposal.totalYesVotes.toString(),
          totalNoVotes: proposal.totalNoVotes.toString(),
          totalAbstainVotes: proposal.totalAbstainVotes.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
