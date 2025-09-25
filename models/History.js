import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  employee: { type: String, required: true },
  device: { type: String, required: true },
  cleanedAt: { type: Date, default: Date.now },
});

export default mongoose.model("History", historySchema);