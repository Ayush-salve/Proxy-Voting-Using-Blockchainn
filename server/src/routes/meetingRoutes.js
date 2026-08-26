import express from 'express';
import {
  listMeetings,
  getMeetingById,
  createMeeting,
  updateMeetingStatus,
  createMeetingSchema,
  updateMeetingStatusSchema,
} from '../controllers/meetingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, listMeetings);
router.get('/:id', authenticate, getMeetingById);
router.post('/', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN), validate(createMeetingSchema), createMeeting);
router.patch('/:id/status', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN), validate(updateMeetingStatusSchema), updateMeetingStatus);

export default router;
