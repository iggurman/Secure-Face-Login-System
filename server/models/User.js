const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const loginHistorySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    success: { type: Boolean, required: true },
    confidence: { type: Number, default: 0 },
    userAgent: { type: String },
    ip: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    // Face embeddings — array of 512-dim vectors (one per captured photo)
    faceEmbeddings: {
      type: [[Number]],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Maximum 10 face embeddings per user",
      },
    },
    faceRegisteredAt: { type: Date },
    loginHistory: {
      type: [loginHistorySchema],
      default: [],
    },
    totalLogins: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────
userSchema.index({ email: 1 });

// ── Methods ──────────────────────────────────────

/** Add a login attempt to history (keep last 50) */
userSchema.methods.recordLogin = async function (success, confidence, req) {
  this.loginHistory.unshift({
    success,
    confidence,
    userAgent: req?.headers?.["user-agent"] || "Unknown",
    ip: req?.ip || "Unknown",
  });
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(0, 50);
  }
  if (success) this.totalLogins += 1;
  await this.save();
};

/** Remove sensitive data before sending to client */
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    totalLogins: this.totalLogins,
    faceRegisteredAt: this.faceRegisteredAt,
    loginHistory: this.loginHistory.slice(0, 10),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
