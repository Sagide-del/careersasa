"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRouter = express_1.default.Router();
// Simple login without JWT for testing
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Simple validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        // For testing, accept a test user
        if (email === 'test@example.com' && password === 'password') {
            return res.json({
                success: true,
                user: { id: '1', name: 'Test User', email: 'test@example.com' },
                message: 'JWT_SECRET not configured - using test mode'
            });
        }
        res.status(401).json({ error: 'Invalid credentials' });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});
// Register endpoint
authRouter.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        res.json({
            success: true,
            message: 'Registration successful (test mode)',
            user: { name, email }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});
exports.default = authRouter;
