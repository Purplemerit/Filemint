import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If connection already established, return it
  if (cached.conn) {
    console.log('📦 [MongoDB] Using cached connection');
    return cached.conn;
  }

  // If connection promise exists, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('⏳ [MongoDB] Initiating new connection...');
    const startTime = Date.now();

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        const duration = Date.now() - startTime;
        console.log(`✅ [MongoDB] Successfully connected to MongoDB in ${duration}ms`);
        console.log(`📊 [MongoDB] Connection State: ${mongoose.connection.readyState} (1 = connected)`);
        return mongoose;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        console.error(`❌ [MongoDB] Connection failed after ${duration}ms`);
        console.error(`🔍 [MongoDB] Error: ${error.message}`);
        
        if (error.message.includes('ENOTFOUND')) {
          console.error('🔍 [MongoDB] DNS Resolution Error - Cannot reach MongoDB host. Check MONGODB_URI and network connectivity.');
        } else if (error.message.includes('ECONNREFUSED')) {
          console.error('🔍 [MongoDB] Connection Refused - MongoDB server may not be running or accessible.');
        } else if (error.message.includes('authentication failed')) {
          console.error('🔍 [MongoDB] Authentication Error - Check MongoDB credentials in MONGODB_URI.');
        }
        
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ [MongoDB] Failed to establish connection:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;