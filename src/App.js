import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    // Use environment variable for API URL
    const API_URL = process.env.REACT_APP_API_URL || 'https://careersasa-production.up.railway.app';
    
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus('? Connected');
        setHealthData(data);
      })
      .catch(err => {
        setBackendStatus('? Failed to connect');
        console.error(err);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50' }}>CareerSasa</h1>
      <p style={{ fontSize: '18px' }}>Welcome to your Career Guidance Platform!</p>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Backend Status: <span style={{ color: backendStatus.includes('?') ? 'green' : 'red' }}>{backendStatus}</span></h3>
        {healthData && (
          <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(healthData, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Your API Endpoints:</h3>
        <ul>
          <li><strong>Health:</strong> /health</li>
          <li><strong>Auth:</strong> /auth/login, /auth/register</li>
          <li><strong>Payments:</strong> /payments/*</li>
          <li><strong>Assessment:</strong> /assessment/*</li>
          <li><strong>Results:</strong> /results/*</li>
        </ul>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Backend URL: https://careersasa-production.up.railway.app
        </p>
      </div>
    </div>
  );
}

export default App;
