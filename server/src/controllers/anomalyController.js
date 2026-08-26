import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export const listAnomalies = async (req, res, next) => {
  try {
    const { severity, isResolved } = req.query;

    const where = {
      ...(severity && { severity }),
      ...(isResolved !== undefined && { isResolved: isResolved === 'true' }),
    };

    const alerts = await prisma.anomalyAlert.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = alerts.map((a) => ({
      ...a,
      rawMetadata: a.rawMetadata ? (typeof a.rawMetadata === 'string' ? JSON.parse(a.rawMetadata) : a.rawMetadata) : null,
    }));

    return res.status(200).json({ success: true, data: { anomalies: formatted } });
  } catch (error) {
    next(error);
  }
};

export const resolveAnomaly = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await prisma.anomalyAlert.update({
      where: { id },
      data: { isResolved: true },
    });

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'ANOMALY_RESOLVED',
      entity: 'ANOMALY_ALERT',
      entityId: id,
      status: 'SUCCESS',
    });

    return res.status(200).json({
      success: true,
      message: 'Anomaly alert marked as resolved.',
      data: { alert },
    });
  } catch (error) {
    next(error);
  }
};
