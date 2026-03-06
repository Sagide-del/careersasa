const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

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
