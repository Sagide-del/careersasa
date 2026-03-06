"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const envCheck_1 = require("./utils/envCheck");
// Load env vars
dotenv_1.default.config();
// Import routers (these will be modified separately)
const auth_1 = __importDefault(require("./routes/auth"));
const payments_1 = __importDefault(require("./routes/payments"));
const assessment_1 = __importDefault(require("./routes/assessment"));
const results_1 = __importDefault(require("./routes/results"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Check environment variables (non-fatal)
(0, envCheck_1.checkRequiredEnvVars)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
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
app.use('/auth', auth_1.default);
app.use('/payments', payments_1.default);
app.use('/assessment', assessment_1.default);
app.use('/results', results_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use((err, req, res, next) => {
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
exports.default = app;
