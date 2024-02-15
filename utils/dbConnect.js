// utils/dbConnect.js

import mongoose from "mongoose";

let cachedConnection = null;

async function dbConnect() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Establish a connection to MongoDB
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Add other options if necessary
    });
    console.error("MongoDB connected successfullyy");

    cachedConnection = db;
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}

export default dbConnect;
