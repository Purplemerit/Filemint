/**
 * Database Initialization Module
 * Runs on server startup to test MongoDB connection and log status
 */

import { logger } from './logger';
import mongoose from 'mongoose';

const SERVICE_NAME = 'DBInit';
let initialized = false;

/**
 * Initialize database connection on server startup
 * This function is called once when the server starts
 */
export async function initializeDatabase() {
  // Prevent multiple initialization attempts
  if (initialized) {
    logger.info(SERVICE_NAME, 'Database already initialized');
    return;
  }

  const startTime = Date.now();
  logger.info(SERVICE_NAME, '🚀 Starting database initialization...');

  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      logger.error(SERVICE_NAME, '❌ MONGODB_URI environment variable is not set');
      return;
    }

    logger.info(SERVICE_NAME, `📍 MongoDB URI: ${mongoURI.substring(0, 50)}...`);

    // Check current connection state
    if (mongoose.connection.readyState === 1) {
      logger.info(SERVICE_NAME, '✅ MongoDB is already connected');
      initialized = true;
      return;
    }

    logger.info(SERVICE_NAME, '⏳ Attempting to connect to MongoDB...');

    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    const duration = Date.now() - startTime;
    logger.info(SERVICE_NAME, `✅ Successfully connected to MongoDB (${duration}ms)`);
    logger.info(SERVICE_NAME, `📊 Connection state: ${mongoose.connection.readyState} (1 = connected)`);

    initialized = true;

    // Log collection information
    try {
      const collections = await mongoose.connection.db?.listCollections().toArray();
      const collectionNames = collections?.map((c) => c.name) || [];
      logger.info(SERVICE_NAME, `📦 Available collections: ${collectionNames.join(', ') || 'none'}`);
    } catch (collErr) {
      logger.warn(SERVICE_NAME, 'Could not list collections', collErr);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(SERVICE_NAME, `❌ Failed to connect to MongoDB after ${duration}ms`, error);

    // Log specific error details
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        logger.error(
          SERVICE_NAME,
          '🔍 DNS Resolution Error - Cannot reach MongoDB host. Check MONGODB_URI and network connectivity.'
        );
      } else if (error.message.includes('ECONNREFUSED')) {
        logger.error(SERVICE_NAME, '🔍 Connection Refused - MongoDB server may not be running or accessible.');
      } else if (error.message.includes('authentication failed')) {
        logger.error(SERVICE_NAME, '🔍 Authentication Error - Check MongoDB credentials in MONGODB_URI.');
      }
    }

    // Don't throw, just log the error to allow app to continue
    // Database operations will fail gracefully
  }
}

/**
 * Get database connection status
 */
export function getDbStatus() {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    initialized,
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || 'unknown',
  };
}

/**
 * Log database status
 */
export function logDbStatus() {
  const status = getDbStatus();
  const emoji = status.readyState === 1 ? '✅' : '⚠️';
  logger.info(
    SERVICE_NAME,
    `${emoji} Database Status: ${status.status} (State: ${status.readyState}) - Host: ${status.host}`
  );
}
