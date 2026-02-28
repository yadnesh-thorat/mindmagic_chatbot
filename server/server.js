import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cron from "node-cron";

import { PORT, MONGO_URI, JWT_SECRET } from "./config.js";
import { User, Entry } from "./models.js";
import { authMiddleware } from "./middleware.js";
import { analyzeAndRespond, visionAnalyze } from "./ai.js";
import { detectHighRisk } from "./risk.js";
import { generateWeekly } from "./weekly.js";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

/* REGISTER */
app.post("/register", async (req, res) => {
  try {
    const { email, password, language, mbti } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      language,
      mbti,
      contentPreference: req.body.contentPreference || "Wellness"
    });
    res.status(201).json({ msg: "User registered successfully", userId: user._id });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ msg: "Registration failed", error: error.message });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user._id, email: user.email, language: user.language, mbti: user.mbti, contentPreference: user.contentPreference } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ msg: "Login failed", error: error.message });
  }
});

/* DAILY ENTRY */
app.post("/entry", authMiddleware, async (req, res) => {
  try {
    const { text, stress, energy, language } = req.body;
    if (!text) return res.status(400).json({ msg: "Text is required" });

    // Get user preferences
    const userData = await User.findById(req.user.id);
    const preference = req.body.contentPreference || userData?.contentPreference || "Wellness";
    const userLanguage = language || userData?.language || "English";

    // Fetch last 5 chat pairs for conversational context
    const history = await Entry.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    const context = history.reverse().map(e => ({ text: e.text, botReply: e.botReply || "" }));

    console.log(`💬 Entry [${preference}] from ${userData?.email}: "${text.substring(0, 50)}..."`);

    // ⚡ SINGLE API CALL — analyze emotion + generate response together
    const aiResult = await analyzeAndRespond({
      text,
      language: userLanguage,
      preference,
      context,
      mbti: userData?.mbti
    });

    // Override risk if hard keywords detected
    if (detectHighRisk(text)) aiResult.risk = "High";

    const { emotion, risk, reply } = aiResult;

    if (!reply) {
      return res.status(503).json({
        msg: "I'm a bit overloaded right now! Please wait a few seconds and try again. 😅",
        aiError: true,
        rateLimited: true
      });
    }

    console.log(`✅ Reply ready — emotion: ${emotion}, risk: ${risk}`);

    // Save to DB
    await Entry.create({
      userId: req.user.id,
      text,
      botReply: reply,
      aura: req.body.aura || "Neutral",
      emotion,
      risk
    });

    res.json({ reply, emotion });
  } catch (error) {
    console.error("❌ Entry route error:", error.message);
    res.status(500).json({ msg: "Failed to process your message.", error: error.message });
  }
});

/* WEEKLY MANUAL */
app.post("/weekly", authMiddleware, async (req, res) => {
  const report = await generateWeekly(req.user.id, req.body.language);
  res.json(report || { msg: "Not enough entries" });
});

/* CHAT HISTORY */
app.get("/history", authMiddleware, async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Convert entries to messages format, include entryId for unsend
    const formatted = [];
    entries.reverse().forEach(e => {
      formatted.push({ sender: "user", text: e.text, entryId: e._id });
      if (e.botReply) formatted.push({ sender: "bot", text: e.botReply, entryId: e._id });
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch history" });
  }
});

/* UNSEND (Delete single entry) */
app.delete("/entry/:id", authMiddleware, async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id  // ensure user can only delete their own
    });
    if (!entry) return res.status(404).json({ msg: "Entry not found" });
    res.json({ msg: "Message unsent" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to unsend message" });
  }
});

/* JOURNAL ENTRIES (Detailed) */
app.get("/journal", authMiddleware, async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch journal" });
  }
});

app.delete("/history", authMiddleware, async (req, res) => {
  try {
    await Entry.deleteMany({ userId: req.user.id });
    res.json({ msg: "History cleared successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to clear history" });
  }
});

/* THE SOUL LENS (Vision) */
app.post("/vision", authMiddleware, async (req, res) => {
  try {
    const { base64Image, caption } = req.body;
    if (!base64Image) return res.status(400).json({ msg: "Image is required" });

    const userData = await User.findById(req.user.id);
    const preference = req.body.contentPreference || userData?.contentPreference || "Wellness";

    const reading = await visionAnalyze({
      base64Image,
      preference,
      caption: caption || ""
    });

    res.json({ reading });
  } catch (error) {
    console.error("❌ Vision route error:", error);
    res.status(500).json({ msg: "Vision analysis failed" });
  }
});

/* HYBRID CRON */
cron.schedule("0 20 * * 0", async () => {
  console.log("Weekly auto-generation triggered");
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));