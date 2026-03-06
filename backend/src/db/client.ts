// src/db/client.ts
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const ASSESSMENTS_FILE = path.join(DATA_DIR, 'assessments.json');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');

// Initialize data files if they don't exist
function initFile(file: string, defaultData: any[] = []) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  }
}

initFile(USERS_FILE);
initFile(PAYMENTS_FILE);
initFile(ASSESSMENTS_FILE);
initFile(RESULTS_FILE);

// Simple database operations
export const db = {
  // Users
  users: {
    findAll: () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')),
    findById: (id: string) => {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      return users.find((u: any) => u.id === id);
    },
    findByEmail: (email: string) => {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      return users.find((u: any) => u.email === email);
    },
    create: (user: any) => {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      users.push(user);
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      return user;
    },
    update: (id: string, updates: any) => {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      const index = users.findIndex((u: any) => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return users[index];
      }
      return null;
    }
  },
  
  // Payments
  payments: {
    findAll: () => JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8')),
    findById: (id: string) => {
      const payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8'));
      return payments.find((p: any) => p.id === id);
    },
    findByUserId: (userId: string) => {
      const payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8'));
      return payments.filter((p: any) => p.userId === userId);
    },
    create: (payment: any) => {
      const payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8'));
      payments.push(payment);
      fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
      return payment;
    },
    update: (id: string, updates: any) => {
      const payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8'));
      const index = payments.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        payments[index] = { ...payments[index], ...updates };
        fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
        return payments[index];
      }
      return null;
    }
  },
  
  // Assessments
  assessments: {
    findAll: () => JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, 'utf-8')),
    findById: (id: string) => {
      const assessments = JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, 'utf-8'));
      return assessments.find((a: any) => a.id === id);
    },
    findByUserId: (userId: string) => {
      const assessments = JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, 'utf-8'));
      return assessments.filter((a: any) => a.userId === userId);
    },
    create: (assessment: any) => {
      const assessments = JSON.parse(fs.readFileSync(ASSESSMENTS_FILE, 'utf-8'));
      assessments.push(assessment);
      fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));
      return assessment;
    }
  },
  
  // Results
  results: {
    findAll: () => JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8')),
    findById: (id: string) => {
      const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
      return results.find((r: any) => r.id === id);
    },
    findByUserId: (userId: string) => {
      const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
      return results.filter((r: any) => r.userId === userId);
    },
    create: (result: any) => {
      const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
      results.push(result);
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
      return result;
    }
  }
};

export default db;
