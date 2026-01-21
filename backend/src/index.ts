/**
 * SwellMind Backend API
 * Express server with routes for spots, sessions, and insights
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import spotsRouter from './api/spots.js';
import sessionsRouter from './api/sessions.js';
import insightsRouter from './api/insights.js';
import authRouter from './api/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Check if required env vars are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    health.status = 'degraded';
    (health as any).warning = 'Missing Supabase configuration';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// API Routes
app.use('/auth', authRouter);
app.use('/spots', spotsRouter);
app.use('/sessions', sessionsRouter);
app.use('/insights', insightsRouter);

// API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'SwellMind API',
    version: '1.0.0',
    description: 'Personalized surf forecast recommendations',
    endpoints: {
      health: 'GET /health',
      auth: {
        signup: 'POST /auth/signup',
        signin: 'POST /auth/signin',
        signout: 'POST /auth/signout',
        me: 'GET /auth/me',
        update: 'PUT /auth/me',
        delete: 'DELETE /auth/me',
        addSpot: 'POST /auth/me/spots',
        removeSpot: 'DELETE /auth/me/spots/:spotId'
      },
      spots: {
        list: 'GET /spots',
        get: 'GET /spots/:id',
        windows: 'GET /spots/:id/windows'
      },
      sessions: {
        create: 'POST /sessions',
        list: 'GET /sessions/me',
        update: 'PUT /sessions/:id',
        delete: 'DELETE /sessions/:id'
      },
      insights: {
        me: 'GET /insights/me'
      }
    },
    documentation: 'https://github.com/your-repo/swellmind'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🏄 SwellMind API Server
  ========================
  Port: ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  
  Endpoints:
  - Health: http://localhost:${PORT}/health
  - API:    http://localhost:${PORT}/
  
  Ready to catch some waves! 🌊
  `);
});

export default app;
