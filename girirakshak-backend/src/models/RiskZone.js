import mongoose from "mongoose";

const riskZoneSchema = new mongoose.Schema(
  {
    zoneId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    state: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    // GeoJSON point — enables MongoDB's $near / $geoWithin geospatial queries
    // once this is backed by a real MongoDB cluster (e.g. to find the
    // nearest zone to a citizen report).
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    riskLevel: { type: String, enum: ["low", "moderate", "high", "critical"], required: true },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    rainfall24h: Number,
    rainfall72h: Number,
    soilMoisture: Number,
    deformationTrend: { type: String, enum: ["falling", "stable", "rising"], default: "stable" },
    roadStatus: { type: String, enum: ["open", "at-risk", "blocked"], default: "open" },
    population: Number,
    note: String,
  },
  { timestamps: true }
);

riskZoneSchema.index({ location: "2dsphere" });

riskZoneSchema.pre("save", function (next) {
  this.location = { type: "Point", coordinates: [this.lng, this.lat] };
  next();
});

export default mongoose.model("RiskZone", riskZoneSchema);
