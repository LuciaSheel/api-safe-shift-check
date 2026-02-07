/**
 * Safe Shift Check API Server
 * Main entry point for the Express.js application
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { setupRoutes } from './routes';
import { notFoundHandler, errorHandler } from './middleware';
import { escalationService } from './services';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS origins - allow multiple localhost ports for development
const CORS_ORIGINS = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'];

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Request logging
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ROUTES
// ============================================

// Setup all API routes
setupRoutes(app);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

// Start server
const server = app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║                                            ║');
  console.log('║     Safe Shift Check API Server           ║');
  console.log('║                                            ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Environment: ${NODE_ENV.padEnd(28)}║`);
  console.log(`║  Port: ${PORT.toString().padEnd(35)}║`);
  console.log(`║  CORS Origins: ${CORS_ORIGINS.length} configured`.padEnd(44) + '║');
  console.log('║                                            ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log('║  API Endpoints:                            ║');
  console.log('║    - GET  /health                          ║');
  console.log('║    - POST /api/auth/login                  ║');
  console.log('║    - POST /api/auth/register               ║');
  console.log('║    - GET  /api/users                       ║');
  console.log('║    - GET  /api/locations                   ║');
  console.log('║    - GET  /api/shifts                      ║');
  console.log('║    - GET  /api/check-ins                   ║');
  console.log('║    - GET  /api/alerts                      ║');
  console.log('║    - GET  /api/notifications               ║');
  console.log('║    - GET  /api/teams                       ║');
  console.log('║    - GET  /api/settings                    ║');
  console.log('║    - GET  /api/reports/dashboard           ║');
  console.log('║                                            ║');
  console.log('╚════════════════════════════════════════════╝');

  // Start background services
  escalationService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
  escalationService.stop();
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
  escalationService.stop();
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
