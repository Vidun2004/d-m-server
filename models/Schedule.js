import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  device: { type: String, required: true },
  day: { type: Number, required: true }, // 1–31
  time: { type: String, required: true }, // "HH:MM"
});

export default mongoose.model("Schedule", scheduleSchema);