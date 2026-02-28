import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

const Entry = mongoose.model("Entry", {
    userId: String,
    text: String,
    botReply: String,
    emotion: String,
    risk: String,
    stress: Number,
    energy: Number,
    createdAt: { type: Date, default: Date.now }
});

// Delete entries where botReply is the generic error fallback
const result = await Entry.deleteMany({
    botReply: "I'm here for you, but I'm having a little trouble thinking of the right words right now. How else can I support you?"
});

console.log(`✅ Deleted ${result.deletedCount} bad entries with fallback replies.`);

// Also delete entries with no botReply (failed saves)
const result2 = await Entry.deleteMany({ botReply: { $in: [null, "", undefined] } });
console.log(`✅ Deleted ${result2.deletedCount} entries with empty bot replies.`);

await mongoose.disconnect();
console.log("Done. Your chat history is clean!");
