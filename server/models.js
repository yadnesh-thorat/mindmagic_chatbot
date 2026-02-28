import mongoose from "mongoose";

export const User = mongoose.model("User", {
  email: { type: String, unique: true },
  password: String,
  language: String,
  mbti: String,
  contentPreference: { type: String, default: "Wellness" },
  createdAt: { type: Date, default: Date.now }
});

export const Entry = mongoose.model("Entry", {
  userId: String,
  text: String,
  botReply: String,
  emotion: String,
  risk: String,
  aura: String,
  createdAt: { type: Date, default: Date.now }
});

export const WeeklyReport = mongoose.model("WeeklyReport", {
  userId: String,
  summary: String,
  createdAt: { type: Date, default: Date.now }
});