"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// src/db/client.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, '../../data');
const USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
const PAYMENTS_FILE = path_1.default.join(DATA_DIR, 'payments.json');
const ASSESSMENTS_FILE = path_1.default.join(DATA_DIR, 'assessments.json');
const RESULTS_FILE = path_1.default.join(DATA_DIR, 'results.json');
// Initialize data files if they don't exist
function initFile(file, defaultData = []) {
    if (!fs_1.default.existsSync(file)) {
        fs_1.default.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    }
}
initFile(USERS_FILE);
initFile(PAYMENTS_FILE);
initFile(ASSESSMENTS_FILE);
initFile(RESULTS_FILE);
// Simple database operations
exports.db = {
    // Users
    users: {
        findAll: () => JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf-8')),
        findById: (id) => {
            const users = JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf-8'));
            return users.find((u) => u.id === id);
        },
        findByEmail: (email) => {
            const users = JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf-8'));
            return users.find((u) => u.email === email);
        },
        create: (user) => {
            const users = JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf-8'));
            users.push(user);
            fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            return user;
        },
        update: (id, updates) => {
            const users = JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf-8'));
            const index = users.findIndex((u) => u.id === id);
            if (index !== -1) {
                users[index] = { ...users[index], ...updates };
                fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
                return users[index];
            }
            return null;
        }
    },
    // Payments
    payments: {
        findAll: () => JSON.parse(fs_1.default.readFileSync(PAYMENTS_FILE, 'utf-8')),
        findById: (id) => {
            const payments = JSON.parse(fs_1.default.readFileSync(PAYMENTS_FILE, 'utf-8'));
            return payments.find((p) => p.id === id);
        },
        findByUserId: (userId) => {
            const payments = JSON.parse(fs_1.default.readFileSync(PAYMENTS_FILE, 'utf-8'));
            return payments.filter((p) => p.userId === userId);
        },
        create: (payment) => {
            const payments = JSON.parse(fs_1.default.readFileSync(PAYMENTS_FILE, 'utf-8'));
            payments.push(payment);
            fs_1.default.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
            return payment;
        },
        update: (id, updates) => {
            const payments = JSON.parse(fs_1.default.readFileSync(PAYMENTS_FILE, 'utf-8'));
            const index = payments.findIndex((p) => p.id === id);
            if (index !== -1) {
                payments[index] = { ...payments[index], ...updates };
                fs_1.default.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
                return payments[index];
            }
            return null;
        }
    },
    // Assessments
    assessments: {
        findAll: () => JSON.parse(fs_1.default.readFileSync(ASSESSMENTS_FILE, 'utf-8')),
        findById: (id) => {
            const assessments = JSON.parse(fs_1.default.readFileSync(ASSESSMENTS_FILE, 'utf-8'));
            return assessments.find((a) => a.id === id);
        },
        findByUserId: (userId) => {
            const assessments = JSON.parse(fs_1.default.readFileSync(ASSESSMENTS_FILE, 'utf-8'));
            return assessments.filter((a) => a.userId === userId);
        },
        create: (assessment) => {
            const assessments = JSON.parse(fs_1.default.readFileSync(ASSESSMENTS_FILE, 'utf-8'));
            assessments.push(assessment);
            fs_1.default.writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));
            return assessment;
        }
    },
    // Results
    results: {
        findAll: () => JSON.parse(fs_1.default.readFileSync(RESULTS_FILE, 'utf-8')),
        findById: (id) => {
            const results = JSON.parse(fs_1.default.readFileSync(RESULTS_FILE, 'utf-8'));
            return results.find((r) => r.id === id);
        },
        findByUserId: (userId) => {
            const results = JSON.parse(fs_1.default.readFileSync(RESULTS_FILE, 'utf-8'));
            return results.filter((r) => r.userId === userId);
        },
        create: (result) => {
            const results = JSON.parse(fs_1.default.readFileSync(RESULTS_FILE, 'utf-8'));
            results.push(result);
            fs_1.default.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
            return result;
        }
    }
};
exports.default = exports.db;
