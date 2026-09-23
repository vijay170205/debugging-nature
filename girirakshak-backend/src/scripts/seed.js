// Populates a real MongoDB database with the demo dataset.
// Usage:  npm run seed   (requires MONGO_URI set in .env)
import "dotenv/config";
import mongoose from "mongoose";
import RiskZone from "../models/RiskZone.js";
import Alert from "../models/Alert.js";
import { riskZones, alerts } from "../data/seedData.js";

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("✗ Set MONGO_URI in your .env file before seeding.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB. Seeding…");

  await RiskZone.deleteMany({});
  await Alert.deleteMany({});

  await RiskZone.insertMany(riskZones);
  await Alert.insertMany(alerts);

  console.log(`✓ Seeded ${riskZones.length} risk zones and ${alerts.length} alerts.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
