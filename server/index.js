require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/authRoutes");

const app = express();

// ── Middleware ──────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true
}));
app.use(express.json({ limit: "20mb" }));       // Allow large base64 payloads
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ── Routes ──────────────────────────────────────
app.use("/api/auth", authRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "FaceAuth Server" });
});

// ── MongoDB ─────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    const PORT = process.env.PORT || 5000;
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});