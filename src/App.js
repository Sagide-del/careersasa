import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    // Check backend health on load
    fetch("https://careersasa-production.up.railway.app/health")
      .then(res => res.json())
      .then(data => {
        setBackendStatus("✅ Connected");
        setStatusData(data);
      })
      .catch(() => setBackendStatus("❌ Disconnected"));
  }, []);

  return (
    <div className="App">
      <header className="header">
        <img src="/logo.png" alt="CareerSasa Logo" className="logo" />
        <h1>CareerSasa</h1>
        <p className="tagline">Your Career Guidance Platform</p>
      </header>

      <main>
        <div className="status-card">
          <h3>Backend Status:</h3>
          <span className={`status-badge ${backendStatus.includes('✅') ? 'connected' : 'disconnected'}`}>
            {backendStatus}
          </span>
          {statusData && (
            <p className="timestamp">Last checked: {new Date().toLocaleTimeString()}</p>
          )}
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🔐</span>
            <h3>Authentication</h3>
            <p>Login & Register with secure authentication</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">💰</span>
            <h3>M-Pesa Paywall</h3>
            <p>Secure payments with Till & STK Push</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📝</span>
            <h3>KCSE Assessment</h3>
            <p>All subjects with quick-fill option</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🎯</span>
            <h3>Interest Tests</h3>
            <p>Discover your career interests</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>Social Media Usage</h3>
            <p>Analyze your digital footprint</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">👨‍👩‍👧</span>
            <h3>Family & Birth Order</h3>
            <p>Understanding your background</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🧠</span>
            <h3>Personality Snapshot</h3>
            <p>Quick personality assessment</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">💾</span>
            <h3>Autosave</h3>
            <p>Never lose your progress</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📄</span>
            <h3>PDF Results</h3>
            <p>Download your career report</p>
          </div>
        </div>

        <div className="api-section">
          <h2>API Endpoints</h2>
          <div className="endpoint-list">
            <div className="endpoint-item">
              <span className="method get">GET</span>
              <code>/health</code>
              <span className="desc">Check API status</span>
            </div>
            <div className="endpoint-item">
              <span className="method post">POST</span>
              <code>/auth/register</code>
              <span className="desc">Create account</span>
            </div>
            <div className="endpoint-item">
              <span className="method post">POST</span>
              <code>/auth/login</code>
              <span className="desc">User login</span>
            </div>
            <div className="endpoint-item">
              <span className="method post">POST</span>
              <code>/payments/stk-push</code>
              <span className="desc">M-Pesa payment</span>
            </div>
            <div className="endpoint-item">
              <span className="method post">POST</span>
              <code>/assessment/kcse</code>
              <span className="desc">Submit KCSE results</span>
            </div>
            <div className="endpoint-item">
              <span className="method get">GET</span>
              <code>/results/{'{id}'}</code>
              <span className="desc">Get career results</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 CareerSasa. All rights reserved.</p>
        <p className="backend-url">Backend: https://careersasa-production.up.railway.app</p>
      </footer>
    </div>
  );
}

export default App;
