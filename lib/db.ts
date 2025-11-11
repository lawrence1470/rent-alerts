/**
 * Database Connection Configuration
 *
 * Serverless-optimized Neon Postgres connection with connection pooling
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create Neon HTTP client (optimized for serverless)
// Uses HTTP instead of WebSocket for better cold start performance
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle with schema
export const db = drizzle(sql, { schema });

// Type-safe database instance
export type Database = typeof db;
