import { logAudit } from '../utils/auditLogger.js';

/**
 * Role-Based Access Control (RBAC) Middleware.
 * 
 * @param  {...string} allowedRoles - List of allowed roles (e.g. 'COMPANY_ADMIN', 'AUDITOR')
 */
export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking role permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log blocked attempt to immutable audit trail
      await logAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entity: 'ENDPOINT',
        entityId: req.originalUrl,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        status: 'BLOCKED',
        details: {
          attemptedEndpoint: req.originalUrl,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
      });

      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`,
      });
    }

    next();
  };
};
