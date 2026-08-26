import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export const createShareholderSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  userEmail: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  folioNumber: z.string().min(3, 'Folio number must be at least 3 characters'),
  totalShares: z.number().int().nonnegative('Shares must be a non-negative integer'),
  votingPower: z.number().int().nonnegative('Voting power must be a non-negative integer').optional(),
  walletAddress: z.string().optional().or(z.literal('')),
});

export const updateShareholderSchema = z.object({
  totalShares: z.number().int().nonnegative().optional(),
  votingPower: z.number().int().nonnegative().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

/**
 * List all shareholders with search, filter, and pagination
 */
export const listShareholders = async (req, res, next) => {
  try {
    const { search, companyId, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {
      ...(companyId && { companyId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { folioNumber: { contains: search } },
          { user: { fullName: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }),
    };

    const [total, shareholders] = await Promise.all([
      prisma.shareholder.count({ where: whereClause }),
      prisma.shareholder.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              walletAddress: true,
              isActive: true,
              approvalStatus: true,
            },
          },
          company: {
            select: { id: true, name: true, regNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedList = shareholders.map((s) => ({
      id: s.id,
      folioNumber: s.folioNumber,
      totalShares: s.totalShares.toString(),
      votingPower: s.votingPower.toString(),
      delegatedPowerOut: s.delegatedPowerOut.toString(),
      availableVotingPower: (s.votingPower - s.delegatedPowerOut).toString(),
      status: s.status,
      user: s.user,
      company: s.company,
      createdAt: s.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        shareholders: formattedList,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin directly registers a new Shareholder with assigned Password, Folio, and Shares
 */
export const createShareholder = async (req, res, next) => {
  try {
    const { fullName, userEmail, password, folioNumber, totalShares, votingPower, walletAddress } = req.body;
    const cleanEmail = userEmail.toLowerCase().trim();

    // Check company
    const company = await prisma.company.findFirst();
    if (!company) {
      return res.status(500).json({ success: false, message: 'No active company found.' });
    }

    // Check existing folio
    const existingFolio = await prisma.shareholder.findUnique({
      where: { folioNumber: folioNumber.trim() },
    });
    if (existingFolio) {
      return res.status(409).json({ success: false, message: 'Folio number already assigned to another shareholder.' });
    }

    // Find or create User
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      const assignedPassword = password || 'Shareholder@12345';
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(assignedPassword, salt);

      const finalWallet = walletAddress && walletAddress.trim() !== ''
        ? walletAddress.trim()
        : `0x${crypto.randomBytes(20).toString('hex')}`;

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          fullName: fullName.trim(),
          passwordHash,
          role: 'SHAREHOLDER',
          walletAddress: finalWallet,
          isActive: true,
          approvalStatus: 'APPROVED',
        },
      });
    } else {
      // Check if user already has a shareholder folio
      const existingProfile = await prisma.shareholder.findUnique({ where: { userId: user.id } });
      if (existingProfile) {
        return res.status(409).json({
          success: false,
          message: 'This user already has an active shareholder folio registered.',
        });
      }
    }

    const assignedVotingPower = votingPower !== undefined ? BigInt(votingPower) : BigInt(totalShares);

    const newShareholder = await prisma.shareholder.create({
      data: {
        userId: user.id,
        companyId: company.id,
        folioNumber: folioNumber.trim(),
        totalShares: BigInt(totalShares),
        votingPower: assignedVotingPower,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, email: true, fullName: true, walletAddress: true } },
        company: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'SHAREHOLDER_CREATED_BY_ADMIN',
      entity: 'SHAREHOLDER',
      entityId: newShareholder.id,
      status: 'SUCCESS',
      details: {
        folioNumber: newShareholder.folioNumber,
        shares: totalShares.toString(),
        votingPower: assignedVotingPower.toString(),
      },
    });

    return res.status(201).json({
      success: true,
      message: `Shareholder folio ${newShareholder.folioNumber} created and password assigned successfully.`,
      data: {
        shareholder: {
          ...newShareholder,
          totalShares: newShareholder.totalShares.toString(),
          votingPower: newShareholder.votingPower.toString(),
          delegatedPowerOut: newShareholder.delegatedPowerOut.toString(),
          availableVotingPower: (newShareholder.votingPower - newShareholder.delegatedPowerOut).toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Shareholder by ID
 */
export const getShareholderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shareholder = await prisma.shareholder.findUnique({
      where: { id },
      include: { user: true, company: true },
    });

    if (!shareholder) {
      return res.status(404).json({ success: false, message: 'Shareholder record not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        shareholder: {
          ...shareholder,
          totalShares: shareholder.totalShares.toString(),
          votingPower: shareholder.votingPower.toString(),
          delegatedPowerOut: shareholder.delegatedPowerOut.toString(),
          availableVotingPower: (shareholder.votingPower - shareholder.delegatedPowerOut).toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Shareholder
 */
export const updateShareholder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { totalShares, votingPower, status } = req.body;

    const updated = await prisma.shareholder.update({
      where: { id },
      data: {
        ...(totalShares !== undefined && { totalShares: BigInt(totalShares) }),
        ...(votingPower !== undefined && { votingPower: BigInt(votingPower) }),
        ...(status !== undefined && { status }),
      },
      include: { user: true, company: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Shareholder folio updated successfully.',
      data: {
        shareholder: {
          ...updated,
          totalShares: updated.totalShares.toString(),
          votingPower: updated.votingPower.toString(),
          delegatedPowerOut: updated.delegatedPowerOut.toString(),
          availableVotingPower: (updated.votingPower - updated.delegatedPowerOut).toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Shareholder portfolio
 */
export const getMyPortfolio = async (req, res, next) => {
  try {
    const shareholder = await prisma.shareholder.findUnique({
      where: { userId: req.user.id },
      include: {
        company: true,
        proxyDelegations: {
          where: { status: 'ACTIVE' },
          include: { proxy: true, proposal: true },
        },
      },
    });

    if (!shareholder) {
      return res.status(404).json({ success: false, message: 'No shareholder folio linked to this account.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        portfolio: {
          id: shareholder.id,
          folioNumber: shareholder.folioNumber,
          totalShares: shareholder.totalShares.toString(),
          votingPower: shareholder.votingPower.toString(),
          delegatedPowerOut: shareholder.delegatedPowerOut.toString(),
          availableVotingPower: (shareholder.votingPower - shareholder.delegatedPowerOut).toString(),
          status: shareholder.status,
          company: shareholder.company,
          activeDelegations: shareholder.proxyDelegations.map((d) => ({
            id: d.id,
            proxy: d.proxy,
            delegatedPower: d.delegatedPower.toString(),
            validUntil: d.validUntil,
            status: d.status,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
