import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

// SIMPLE HEALTH CHECK - ALWAYS WORKS
app.get('/health', (req, res) => {
  console.log('? Health check at:', new Date().toISOString());
  res.status(200).json({ 
    status: 'healthy',
    time: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CareerSasa API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`? Server running on port ${PORT}`);
  console.log(`? Health check: http://localhost:${PORT}/health`);
});

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
