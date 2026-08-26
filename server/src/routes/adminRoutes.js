import express from 'express';
import {
  listPendingRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  createProxyRepresentative,
  createProxySchema,
  approveRequestSchema,
  rejectRequestSchema,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Admin Only Endpoints
router.use(authenticate, authorizeRoles(ROLES.COMPANY_ADMIN));

// List pending registration requests
router.get('/registration-requests', listPendingRegistrationRequests);

// Approve registration request
router.post('/registration-requests/:id/approve', validate(approveRequestSchema), approveRegistrationRequest);

// Reject registration request
router.post('/registration-requests/:id/reject', validate(rejectRequestSchema), rejectRegistrationRequest);

// Create Proxy Representative directly
router.post('/proxies', validate(createProxySchema), createProxyRepresentative);

export default router;
