import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import Schedule from "./models/Schedule.js";
import History from "./models/History.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI);

// Create schedule
app.post("/schedule", async (req, res) => {
  try {
    const { employee, device, day, time } = req.body;
    const schedule = new Schedule({ employee, device, day, time });
    await schedule.save();
    res.json({ message: "Schedule added", schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get schedules (only next upcoming date for each schedule)
app.get("/schedule", async (req, res) => {
  try {
    const schedules = await Schedule.find();
    const now = new Date();

    const upcoming = schedules.map((s) => {
      let nextDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        s.day,
        s.time.split(":")[0],
        s.time.split(":")[1] || 0
      );

      // if date already passed, push to next month
      if (nextDate < now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      return {
        id: s._id,
        employee: s.employee,
        device: s.device,
        day: s.day,
        time: s.time,
        dateTime: nextDate,
      };
    });

    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /schedule/:id/cleaned
app.post("/schedule/:id/cleaned", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    // Log history
    const log = new History({
      schedule: schedule._id,
      employee: schedule.employee,
      device: schedule.device,
      cleanedAt: new Date(),
    });
    await log.save();

    // Optional: store lastCleaned date in schedule
    schedule.lastCleaned = new Date();
    await schedule.save();

    res.json({ message: "Schedule marked as cleaned", schedule, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history/:employee?page=1&limit=5
app.get("/history/:employee", async (req, res) => {
  try {
    const employee = req.params.employee;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const logs = await History.find({ employee })
      .sort({ cleanedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await History.countDocuments({ employee });

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /schedule/:id -> update schedule
app.put("/schedule/:id", async (req, res) => {
  try {
    const { employee, device, day, time } = req.body;
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { employee, device, day, time },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Updated successfully", schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /schedule/:id -> delete schedule
app.delete("/schedule/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
