import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        // The listModels method is actually on the genAI object in some versions or via another path
        // Let's try to find it
        console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "Yes" : "No");

        // In @google/generative-ai, listModels is not a direct method on genAI
        // It's usually handled via the discovery API or just trial and error.
        // However, some people use this:
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Error Details:");
        console.error("Status:", e.status);
        console.error("Message:", e.message);
        if (e.response) {
            console.error("Response Data:", JSON.stringify(await e.response.json()));
        }
    }
}

run();
