import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { checkRequiredEnvVars } from './utils/envCheck';

// Load env vars
dotenv.config();

// Import routers (these will be modified separately)
import authRouter from './routes/auth';
import paymentsRouter from './routes/payments';
import assessmentRouter from './routes/assessment';
import resultsRouter from './routes/results';

const app = express();
const PORT = process.env.PORT || 4000;

// Check environment variables (non-fatal)
checkRequiredEnvVars();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint (works even without env vars)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'CareerSasa API is running',
    version: '1.0.0',
    endpoints: ['/health', '/test', '/auth', '/payments', '/assessment', '/results']
  });
});

// Routes (will be conditionally loaded)
app.use('/auth', authRouter);
app.use('/payments', paymentsRouter);
app.use('/assessment', assessmentRouter);
app.use('/results', resultsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`CareerSasa backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});

export default app;
