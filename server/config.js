import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const JWT_SECRET = process.env.JWT_SECRET;