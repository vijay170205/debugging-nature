import mongoose from "mongoose";

// Citizen / field-official geo-tagged report — problem statement requirement (e).
const reportSchema = new mongoose.Schema(
  {
    reporterType: { type: String, enum: ["citizen", "field-official"], default: "citizen" },
    description: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    photoUrl: String,
    nearestZoneId: String,
    nearestZoneName: String,
    distanceKm: Number,
    status: { type: String, enum: ["pending", "verified", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
