import mongoose from "mongoose";

// Tracks whether we're actually talking to MongoDB. Controllers check this
// flag and fall back to the in-memory store when it's false, so the whole
// app runs out of the box with zero database setup — swap in a real
// MONGO_URI (e.g. a free MongoDB Atlas cluster) whenever you're ready and
// nothing else needs to change.
let dbConnected = false;

export function isDbConnected() {
  return dbConnected;
}

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log("⚠ No MONGO_URI set — running on in-memory data store (fine for local dev/demo).");
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    dbConnected = true;
    console.log("✓ MongoDB connected");
  } catch (err) {
    dbConnected = false;
    console.warn("⚠ Could not connect to MongoDB — falling back to in-memory data store.");
    console.warn(`  (${err.message})`);
  }
}
