const express = require('express');
const cors = require('cors'); // <-- ADD THIS LINE
const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration - Allow your Vercel frontend
const corsOptions = {
  origin: 'https://careersasa.vercel.app', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS middleware to ALL routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors(corsOptions));

// Health check - ALWAYS WORKS
app.get('/health', (req, res) => {
  console.log('? Health check at:', new Date().toISOString());
  res.status(200).json({ 
    status: 'healthy', 
    time: new Date().toISOString() 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CareerSasa API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`? Server running on port ${PORT}`);
  console.log(`? Health check: http://localhost:${PORT}/health`);
});
