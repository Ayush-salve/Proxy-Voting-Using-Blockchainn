import express from 'express';
import { getBlockchainExplorer, verifyVoteByHash } from '../controllers/blockchainController.js';

const router = express.Router();

// Public blockchain transaction explorer
router.get('/transactions', getBlockchainExplorer);

// Public cryptographic dual-state verification
router.get('/verify/:hash', verifyVoteByHash);

export default router;
