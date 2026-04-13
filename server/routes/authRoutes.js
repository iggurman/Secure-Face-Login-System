const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { register, login, getMe, resetFace } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ── Validators ───────────────────────────────────

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("images")
    .isArray({ min: 3, max: 10 })
    .withMessage("Provide 3–10 face images"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("image").notEmpty().withMessage("Face image is required"),
];

// ── Routes ───────────────────────────────────────

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", protect, getMe);
router.delete("/reset-face", protect, resetFace);

module.exports = router;
