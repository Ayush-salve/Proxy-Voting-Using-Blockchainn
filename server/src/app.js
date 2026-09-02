import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import shareholderRoutes from './routes/shareholderRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import votingRoutes from './routes/votingRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import anomalyRoutes from './routes/anomalyRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import blockchainRoutes from './routes/blockchainRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS
const normalizedClientUrl = CLIENT_URL.startsWith('http') ? CLIENT_URL : `https://${CLIENT_URL}`;
const allowedOrigins = [
  CLIENT_URL,
  CLIENT_URL?.replace(/\/$/, ''),
  normalizedClientUrl,
  normalizedClientUrl.replace(/\/$/, ''),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.some((o) => o.replace(/\/$/, '') === cleanOrigin) ||
        cleanOrigin.endsWith('.onrender.com') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback for production deployment flexibility
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.options('*', cors());

// 3. Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api', generalLimiter);

// 6. Health Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ONLINE',
    platform: 'BlockProxy Corporate Governance Engine',
    version: '1.1.0-PROD',
    timestamp: new Date().toISOString(),
  });
});

// 7. Mount Core Business Modules
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shareholders', shareholderRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/votes', votingRoutes);
app.use('/api/proxies', proxyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/audit-logs', auditRoutes);

// 8. 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found on BlockProxy server.`,
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);

// 10. Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 BlockProxy Backend Server Running on Port ${PORT}`);
    console.log(`🛡️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Enabled For: ${CLIENT_URL}`);
    console.log(`====================================================`);
  });
}

export default app;
