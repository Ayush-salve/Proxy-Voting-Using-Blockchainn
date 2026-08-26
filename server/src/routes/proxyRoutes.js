import express from 'express';
import {
  delegatePower,
  revokeDelegation,
  getDelegationsReceived,
  getMyDelegationsGiven,
  castProxyVote,
  delegatePowerSchema,
  castProxyVoteSchema,
} from '../controllers/proxyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Shareholder delegates power
router.post('/delegate', authenticate, authorizeRoles(ROLES.SHAREHOLDER), validate(delegatePowerSchema), delegatePower);

// Shareholder or Admin revokes delegation
router.delete('/revoke/:id', authenticate, revokeDelegation);

// Proxy representative views assigned delegations
router.get('/received', authenticate, authorizeRoles(ROLES.PROXY_REPRESENTATIVE), getDelegationsReceived);

// Shareholder views delegations they granted
router.get('/given', authenticate, authorizeRoles(ROLES.SHAREHOLDER), getMyDelegationsGiven);

// Proxy representative casts a vote using delegated ticket
router.post('/vote', authenticate, authorizeRoles(ROLES.PROXY_REPRESENTATIVE), validate(castProxyVoteSchema), castProxyVote);

export default router;
