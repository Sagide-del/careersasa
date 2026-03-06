// src/db/init.ts
import fs from 'fs';
import path from 'path';
import { db } from './client';

export function initializeDatabase() {
  console.log('? Database initialized (JSON file-based)');
  return true;
}
