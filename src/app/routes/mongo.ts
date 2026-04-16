import mongoose from "mongoose";

// Use global variable to maintain connection across hot reloads (Next.js)
let isConnected = global.mongoose?.isConnected || false;

const connectMongo = async () => {
  // If connection already established, return early
  if (isConnected) {
    console.log("📦 [MongoDB] Using existing connection");
    return;
  }

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    const error = "MongoDB URI is not defined in environment variables.";
    console.error(`❌ [MongoDB] ${error}`);
    throw new Error(error);
  }

  console.log(`📍 [MongoDB] URI: ${mongoURI.substring(0, 50)}...`);
  console.log("⏳ [MongoDB] Attempting to connect...");
  const startTime = Date.now();

  try {
    // Connect to MongoDB with recommended options
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,  // 45 seconds
    });

    const duration = Date.now() - startTime;
    isConnected = true;
    // Store connection status globally to persist across hot reloads
    if (!global.mongoose) global.mongoose = { isConnected: true };
    else global.mongoose.isConnected = true;

    console.log(`✅ [MongoDB] Successfully connected in ${duration}ms`);
    console.log(`📊 [MongoDB] Connection State: ${mongoose.connection.readyState} (1 = connected)`);
    console.log(`🖥️  [MongoDB] Host: ${mongoose.connection.host}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [MongoDB] Connection failed after ${duration}ms`);
    
    if (error instanceof Error) {
      console.error(`🔍 [MongoDB] Error: ${error.message}`);
      
      if (error.message.includes("ENOTFOUND")) {
        console.error("🔍 [MongoDB] DNS Resolution Error - Cannot reach MongoDB host. Check MONGODB_URI and network connectivity.");
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("🔍 [MongoDB] Connection Refused - MongoDB server may not be running or accessible.");
      } else if (error.message.includes("authentication failed")) {
        console.error("🔍 [MongoDB] Authentication Error - Check MongoDB credentials in MONGODB_URI.");
      }
    } else {
      console.error("🔍 [MongoDB] Unknown error:", error);
    }
    
    throw new Error("Failed to connect to MongoDB");
  }
};

export default connectMongo;
