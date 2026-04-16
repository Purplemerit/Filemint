/**
 * Server-side Database Initializer
 * This component is rendered on the server to initialize the database connection
 */

import { initializeDatabase } from '@/app/lib/dbInitialize';

export async function DatabaseInitializer() {
  // Initialize database on server startup
  await initializeDatabase();
  return null;
}
