import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../config/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { logAudit } from '../utils/auditLogger.js';
import { ROLE_LIST } from '../constants/roles.js';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(ROLE_LIST).default('SHAREHOLDER'),
  walletAddress: z.string().optional().or(z.literal('')),
  requestedShares: z.number().int().nonnegative().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Generate a simulated 40-character Ethereum wallet address if none provided
 */
const generateRandomWallet = () => {
  return `0x${crypto.randomBytes(20).toString('hex')}`;
};

/**
 * Register a new user account.
 * If user registers with corporate admin email, auto-assigns admin with instant approval.
 * Otherwise, creates account in PENDING approval state and alerts the Admin.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, role, walletAddress, requestedShares } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this corporate email address is already registered.',
      });
    }

    // Hash password with 12 salt rounds
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if Corporate Admin Registration (starts with admin@ or explicit admin email)
    const isAdminEmail = cleanEmail.startsWith('admin') || cleanEmail.includes('companysecretary');
    const assignedRole = isAdminEmail ? 'COMPANY_ADMIN' : role || 'SHAREHOLDER';
    const isApproved = isAdminEmail; // Admin auto-approved; others require Admin authorization

    const finalWallet = walletAddress && walletAddress.trim() !== ''
      ? walletAddress.trim()
      : generateRandomWallet();

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        fullName: fullName.trim(),
        role: assignedRole,
        walletAddress: finalWallet,
        isActive: isApproved,
        approvalStatus: isApproved ? 'APPROVED' : 'PENDING',
        requestedShares: requestedShares ? BigInt(requestedShares) : BigInt(1000),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        walletAddress: true,
        isActive: true,
        approvalStatus: true,
        createdAt: true,
      },
    });

    // If pending approval, create security alert notification for Company Admin
    if (!isApproved) {
      await prisma.anomalyAlert.create({
        data: {
          userId: newUser.id,
          targetEntity: 'REGISTRATION_APPROVAL',
          entityId: newUser.id,
          reason: `New registration request: ${newUser.fullName} (${newUser.email}) requested role '${newUser.role}'`,
          severity: 'LOW',
          rawMetadata: JSON.stringify({
            role: newUser.role,
            email: newUser.email,
            walletAddress: newUser.walletAddress,
            requestedShares: requestedShares || 1000,
          }),
        },
      });

      await logAudit({
        userId: newUser.id,
        userRole: newUser.role,
        action: 'USER_REGISTRATION_SUBMITTED_PENDING_APPROVAL',
        entity: 'USER',
        entityId: newUser.id,
        status: 'PENDING',
        details: { role: newUser.role, email: newUser.email },
      });

      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message: 'Registration request submitted successfully! Your account is pending administrator approval and folio allocation.',
        data: { user: newUser },
      });
    }

    // Auto-approved Admin receives tokens immediately
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    await logAudit({
      userId: newUser.id,
      userRole: newUser.role,
      action: 'ADMIN_REGISTERED',
      entity: 'USER',
      entityId: newUser.id,
      status: 'SUCCESS',
    });

    return res.status(201).json({
      success: true,
      requiresApproval: false,
      message: 'Corporate Administrator account created and verified.',
      data: {
        user: newUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user with Email, Role, and Password verification
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        shareholderProfile: {
          include: {
            company: {
              select: { id: true, name: true, regNumber: true },
            },
          },
        },
      },
    });

    if (!user) {
      await logAudit({
        action: 'USER_LOGIN_FAILED',
        entity: 'USER',
        ipAddress: clientIp,
        userAgent,
        status: 'FAILED',
        details: { email, reason: 'User not found' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Check Role match if explicitly selected in login form
    if (role && role.trim() !== '') {
      if (user.role !== role) {
        return res.status(401).json({
          success: false,
          message: `Role mismatch: This account is registered as '${user.role.replace('_', ' ')}', but you selected '${role.replace('_', ' ')}'. Please select your registered role.`,
        });
      }
    }

    // Verify Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAudit({
        userId: user.id,
        userRole: user.role,
        action: 'USER_LOGIN_FAILED',
        entity: 'USER',
        entityId: user.id,
        ipAddress: clientIp,
        userAgent,
        status: 'FAILED',
        details: { email, reason: 'Incorrect password' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Check Approval Status
    if (user.approvalStatus === 'PENDING') {
      return res.status(403).json({
        success: false,
        code: 'REGISTRATION_PENDING_APPROVAL',
        message: 'Your registration request is currently pending administrator approval. You will receive access once the company secretary approves your folio and voting allocation.',
      });
    }

    if (user.approvalStatus === 'REJECTED') {
      return res.status(403).json({
        success: false,
        code: 'REGISTRATION_REJECTED',
        message: `Your registration request was rejected by the company administrator${user.rejectionReason ? ': ' + user.rejectionReason : '.'}`,
      });
    }

    // Check Account active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact governance administration.',
      });
    }

    // Generate JWTs
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      entity: 'USER',
      entityId: user.id,
      ipAddress: clientIp,
      userAgent,
      status: 'SUCCESS',
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      walletAddress: user.walletAddress,
      isActive: user.isActive,
      approvalStatus: user.approvalStatus,
      shareholderProfile: user.shareholderProfile
        ? {
            id: user.shareholderProfile.id,
            folioNumber: user.shareholderProfile.folioNumber,
            totalShares: user.shareholderProfile.totalShares.toString(),
            votingPower: user.shareholderProfile.votingPower.toString(),
            delegatedPowerOut: user.shareholderProfile.delegatedPowerOut.toString(),
            availableVotingPower: (
              user.shareholderProfile.votingPower - user.shareholderProfile.delegatedPowerOut
            ).toString(),
            status: user.shareholderProfile.status,
            company: user.shareholderProfile.company,
          }
        : null,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        walletAddress: true,
        isActive: true,
        approvalStatus: true,
        createdAt: true,
        shareholderProfile: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const formattedUser = {
      ...user,
      shareholderProfile: user.shareholderProfile
        ? {
            ...user.shareholderProfile,
            totalShares: user.shareholderProfile.totalShares.toString(),
            votingPower: user.shareholderProfile.votingPower.toString(),
            delegatedPowerOut: user.shareholderProfile.delegatedPowerOut.toString(),
            availableVotingPower: (
              user.shareholderProfile.votingPower - user.shareholderProfile.delegatedPowerOut
            ).toString(),
          }
        : null,
    };

    return res.status(200).json({ success: true, data: { user: formattedUser } });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token
 */
export const refreshSession = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User invalid or inactive.' });
    }

    const newAccessToken = generateAccessToken(user);
    return res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'USER_LOGOUT',
        entity: 'USER',
        entityId: req.user.id,
        status: 'SUCCESS',
      });
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};
