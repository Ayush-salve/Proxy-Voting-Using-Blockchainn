import prisma from '../config/db.js';

/**
 * Creates an immutable audit log entry in the database.
 * 
 * @param {Object} params
 * @param {string} [params.userId] - ID of the user performing the action
 * @param {string} [params.userRole] - Role of the user
 * @param {string} params.action - Event action code (e.g. USER_LOGIN, SHAREHOLDER_CREATED)
 * @param {string} params.entity - Target entity name (e.g. USER, SHAREHOLDER, VOTE)
 * @param {string} [params.entityId] - ID of the affected entity
 * @param {string} [params.ipAddress] - Client IP address
 * @param {string} [params.userAgent] - Client Browser / Agent info
 * @param {string} [params.status='SUCCESS'] - Outcome: SUCCESS, FAILED, BLOCKED
 * @param {Object} [params.details] - Additional JSON metadata
 */
export const logAudit = async ({
  userId = null,
  userRole = null,
  action,
  entity,
  entityId = null,
  ipAddress = null,
  userAgent = null,
  status = 'SUCCESS',
  details = null,
}) => {
  try {
    const formattedDetails = details
      ? typeof details === 'object'
        ? JSON.stringify(details)
        : String(details)
      : null;

    await prisma.auditLog.create({
      data: {
        userId,
        userRole,
        action,
        entity,
        entityId,
        ipAddress,
        userAgent,
        status,
        details: formattedDetails,
      },
    });
  } catch (err) {
    console.error(`[AUDIT_LOG_ERROR] Failed to record audit log for action ${action}:`, err.message);
  }
};
