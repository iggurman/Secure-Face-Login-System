const jwt = require("jsonwebtoken");
const axios = require("axios");
const { validationResult } = require("express-validator");
const User = require("../models/User");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = "7d";

// ── Helpers ──────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

async function callAI(endpoint, payload) {
  const response = await axios.post(`${AI_URL}${endpoint}`, payload, {
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

// ── POST /api/auth/register ───────────────────────
/**
 * Body: { name, email, images: string[] }   ← images are base64 strings
 * Flow:
 *   1. Validate input
 *   2. Check email not taken
 *   3. Send each image to AI → extract embedding
 *   4. Store embeddings in MongoDB
 *   5. Return JWT
 */
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, images } = req.body;

  try {
    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    if (!images || images.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least 3 face images for registration",
      });
    }

    // Extract embeddings from each image via AI service
    const embeddings = [];
    const failedIndexes = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const aiRes = await callAI("/extract-embedding", {
          image_base64: images[i],
        });
        if (aiRes.success && aiRes.embedding) {
          embeddings.push(aiRes.embedding);
        } else {
          failedIndexes.push(i + 1);
        }
      } catch {
        failedIndexes.push(i + 1);
      }
    }

    if (embeddings.length < 3) {
      return res.status(400).json({
        success: false,
        message: `Could not detect face in images: ${failedIndexes.join(", ")}. Please retake those photos in better lighting.`,
      });
    }

    // Save user
    // 🔥 Average embeddings for better accuracy
    const avgEmbedding = embeddings[0].map((_, i) =>
      embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
    );

    // Save user with SINGLE embedding
    const user = await User.create({
      name,
      email,
      faceEmbeddings: [avgEmbedding],  // ✅ important change
      faceRegisteredAt: new Date(),
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

// ── POST /api/auth/login ──────────────────────────
/**
 * Body: { email, image: string }   ← image is base64
 * Flow:
 *   1. Find user by email
 *   2. Send live image + stored embeddings to AI
 *   3. If match → sign JWT, record login
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, image } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with that email" });
    }

    if (!user.faceEmbeddings || user.faceEmbeddings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No face data registered. Please register first.",
      });
    }

    // Call AI comparison
    const aiRes = await callAI("/compare-face", {
      image_base64: image,
      stored_embeddings: user.faceEmbeddings,
      check_live: true,
    });

    // Record this login attempt
    await user.recordLogin(aiRes.match, aiRes.confidence, req);

    if (!aiRes.success) {
      return res.status(500).json({ success: false, message: aiRes.error || "AI service error" });
    }

    if (!aiRes.is_live && aiRes.is_live !== null) {
      return res.status(401).json({
        success: false,
        message: "Liveness check failed. Please blink naturally and try again.",
        confidence: aiRes.confidence,
      });
    }

    if (!aiRes.match) {
      return res.status(401).json({
        success: false,
        message: "Face not recognised. Try better lighting or re-register.",
        confidence: Math.round(aiRes.confidence * 100),
      });
    }

    const token = signToken(user._id);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      confidence: Math.round(aiRes.confidence * 100),
      user: user.toPublicJSON(),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({ success: false, message: "AI service unavailable. Please try again shortly." });
    }
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// ── GET /api/auth/me ──────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── DELETE /api/auth/reset-face ───────────────────
exports.resetFace = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      faceEmbeddings: [],
      faceRegisteredAt: null,
    });
    return res.json({ success: true, message: "Face data cleared. Please re-register." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
