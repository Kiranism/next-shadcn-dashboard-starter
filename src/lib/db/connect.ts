// src/lib/db/connect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('❌ MONGODB_URI not defined');

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = !!db.connections[0].readyState;
    console.log('✅ MongoDB connected');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error', error);
    throw error;
  }
}
