import prisma from '../config/db.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, status, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      ...(action && { action: { contains: action } }),
      ...(entity && { entity }),
      ...(status && { status }),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formatted = logs.map((l) => ({
      ...l,
      details: l.details ? (typeof l.details === 'string' ? JSON.parse(l.details) : l.details) : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        logs: formatted,
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
