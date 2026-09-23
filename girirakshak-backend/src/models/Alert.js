import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true },
    zoneId: { type: String, required: true },
    severity: { type: String, enum: ["low", "moderate", "high", "critical"], required: true },
    message: { type: String, required: true },
    time: String,
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
