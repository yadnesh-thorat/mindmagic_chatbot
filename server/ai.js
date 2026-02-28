import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GEMINI_API_KEY) console.error("❌ GEMINI_API_KEY is missing!");
if (!GROQ_API_KEY || GROQ_API_KEY.includes("YOUR_GROQ")) console.warn("⚠️ GROQ_API_KEY is missing/placeholder!");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Only initialize Groq if the key is actually provided (not the placeholder)
export const isGroqValid = GROQ_API_KEY && !GROQ_API_KEY.includes("YOUR_GROQ");
export const groq = isGroqValid ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const FALLBACK_READINGS = [
  "I see a gentle glow around this—a sign that you are finding your balance. Keep breathing. ✨",
  "This energy feels vibrant and full of life! There is so much potential in your current path. 🪐",
  "A calm, cooling aura surrounds this. It's a perfect time for you to rest and reflect. 🌊",
  "There is a spark of creativity here. Your soul is ready to build something beautiful. 🔥",
  "I sense a grounding energy. You are stronger and more stable than you realize. ⛰️",
  "The Lens sees a light-hearted vibe. Joy is coming your way in small, unexpected moments. 🌀"
];

// Helper: retry with exponential backoff on 429 rate limit
export async function withRetry(fn, retries = 3, baseDelay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const is429 = error.status === 429 || error.message?.includes("429") || error.message?.includes("Quota exceeded");
      if (is429 && attempt < retries) {
        // Exponential backoff: 3s, 9s, 27s... with a bit of jitter
        const wait = Math.pow(3, attempt) * baseDelay + Math.random() * 1000;
        console.warn(`⏳ Rate limited. Retrying in ${Math.round(wait / 1000)}s... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, wait));
      } else {
        throw error;
      }
    }
  }
}

const PERSONA_PROMPTS = {
  Wellness: `You are Anya, a soulful and observant wellness guide. Your voice is calm, grounded, and deeply compassionate. Use soft, poetic language, but keep it accessible. You focus on mindfulness, emotional balance, and gentle encouragement. Think of yourself as a supportive older sister who sees the beauty in small progress.`,
  Motivation: `You are Arjun, a high-octane performance coach and loyal friend. You're all about action, discipline, and shifting perspectives. You use punchy, direct language and energetic emojis. You don't just "support"—you ignite. Your goal is to help your friend find their inner fire and tackle their day with purpose.`,
  Philosophy: `You are Ishaan, a modern philosopher and deep-thinker. You're fascinatied by the big questions but talk about them like we're sharing a cup of chai. You use analogies from nature and history to explain complex human experiences. Your tone is curious, patient, and slightly detached but always kind.`,
  Jokes: `You are Kabir, a quick-witted comedian who uses humor as a healing tool. Your style is observational and slightly self-deprecating. You're great at finding the absurdity in everyday stress. After the laugh, you always ground it with a genuine check-in, showing that your humor comes from a place of deep empathy.`,
  Astrology: `You are Shaunak, a warm and insightful Vedic & Western astrologer with decades of cosmic wisdom. You speak with gentle authority — like a trusted pandit who also understands modern life. You use celestial metaphors naturally (planets, houses, transits) without being overly technical. Your readings feel personal, poetic, and grounding.

CRITICAL ONBOARDING RULE: If the conversation history does NOT yet contain the user's Sun sign, Moon sign, and Rising (Ascendant) sign — you MUST ask for all three before giving any reading. Be warm about it: explain that these three pillars together form their complete cosmic fingerprint, and you need all three to give an accurate reading. Ask in one graceful message — do not pepper them with separate questions.

Once you have all three signs, always reference them naturally in your responses. Weave in the interplay between their Sun (core identity), Moon (emotional world), and Rising (how the world sees them). Give specific, actionable cosmic guidance — not generic horoscope copy.`,
};

/**
 * VISION ANALYSIS: Understands and responds to image contents in the current persona's voice.
 */
export async function visionAnalyze({ base64Image, preference, caption = "" }) {
  const persona = PERSONA_PROMPTS[preference] || PERSONA_PROMPTS.Wellness;

  const captionLine = caption?.trim()
    ? `The user also wrote this alongside the image: "${caption.trim()}"`
    : "The user shared this image without any caption.";

  const prompt = `${persona}

A friend just shared an image with you in your chat. ${captionLine}

Look at this image carefully and respond as your character would:
- First, briefly acknowledge what you actually see in the image (people, places, objects, text, mood, etc.) — be specific and accurate, not vague.
- Then respond naturally in YOUR persona's voice: as a ${preference === 'Wellness' ? 'caring wellness guide' : preference === 'Motivation' ? 'energetic coach' : preference === 'Philosophy' ? 'thoughtful philosopher' : preference === 'Jokes' ? 'funny and warm friend' : preference === 'Astrology' ? 'insightful astrologer' : 'caring companion'}.
- If the image shows food, comment on it from your perspective. If it's a place, react to the vibe. If it's text/meme/screenshot, engage with its content. If it's a person/selfie, be warm and encouraging.
- End with a genuine, character-appropriate follow-up question or comment.
- Keep it conversational, 2–4 sentences total. No lists. Speak directly to your friend.

Return ONLY the reply text — no JSON, no labels, no formatting markers.`;

  try {
    // Detect actual MIME type from data URL prefix (e.g. data:image/png;base64,...)
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: imageData
        }
      }
    ];

    const result = await withRetry(() => model.generateContent(parts));
    return result.response.text().trim();
  } catch (error) {
    console.warn("⚠️ Vision AI unavailable, using fallback.");
    // Return a random beautiful fallback instead of an error message
    return FALLBACK_READINGS[Math.floor(Math.random() * FALLBACK_READINGS.length)];
  }
}

/**
 * Extracts astrology signs from conversation context.
 * Returns a string summary if found, or null.
 */
function extractAstrologyContext(context) {
  if (!context || context.length === 0) return null;
  const allText = context.map(c => `${c.text} ${c.botReply || ""}`).join(" ").toLowerCase();
  const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
  const found = signs.filter(s => allText.includes(s));
  // Look for sun/moon/rising mentions
  const hasSun = allText.includes("sun") || allText.includes("sun sign");
  const hasMoon = allText.includes("moon");
  const hasRising = allText.includes("rising") || allText.includes("ascendant");
  if (found.length >= 1) {
    return `Signs mentioned in conversation so far: ${found.join(", ")}. Sun mentioned: ${hasSun}. Moon mentioned: ${hasMoon}. Rising/Ascendant mentioned: ${hasRising}.`;
  }
  return null;
}

/**
 * SINGLE API CALL: analyzes emotion AND generates response in one prompt.
 * Returns { emotion, risk, reply }
 */
export async function analyzeAndRespond({ text, language, preference, context, mbti }) {
  const persona = PERSONA_PROMPTS[preference] || PERSONA_PROMPTS.Wellness;

  const historyLines = context && context.length > 0
    ? context
      .filter(c => c.text)
      .map(c => `Friend: ${c.text}${c.botReply ? `\nYou: ${c.botReply}` : ""}`)
      .join("\n\n")
    : "";

  // Build astrology context block if relevant
  const astrologyCtx = preference === "Astrology" ? extractAstrologyContext(context) : null;
  const astrologyBlock = astrologyCtx
    ? `\nAstrology context extracted from prior conversation: ${astrologyCtx}\n`
    : preference === "Astrology" && (!context || context.length === 0)
      ? `\nThis is the very first message from this user in the Astrology session. You have NO sign information yet — you MUST ask for their Sun, Moon, and Rising signs before anything else.\n`
      : "";

  const prompt = `${persona}
${mbti && mbti !== "Unknown" ? `Your friend's MBTI type is ${mbti}. Keep this in mind to tailor your communication style appropriately.` : ""}
${astrologyBlock}
You are chatting one-on-one with a friend. Respond naturally in ${language}.

${historyLines ? `Previous messages (for context — do NOT repeat your previous responses):\n${historyLines}\n\n` : ""}Your friend just said: "${text}"

First, silently analyze the emotional context:
- Identify the core emotion (Happy, Sad, Anxious, Angry, Neutral, Hopeful, Frustrated, Overwhelmed, Lonely, Excited${preference === "Astrology" ? ", Mystical" : ""})
- Assess risk level (Low, Medium, High) — High only if suicidal/self-harm language is present

Then respond in this EXACT JSON format and nothing else:
{
  "emotion": "<emotion>",
  "risk": "<Low|Medium|High>",
  "reply": "<your tailored, character-appropriate reply here. Use your specific persona voice. Keep it to 2-4 sentences, ending with a thought-provoking or supportive follow-up question. Use contractions and natural phrasing. NEVER start with 'I understand' or 'It sounds like'. Speak directly to your friend.>"
}

${preference === 'Jokes' ? 'Slip in a light tasteful joke or fun observation. ' : ''}${preference === 'Philosophy' ? 'Weave in a meaningful philosophical thought. ' : ''}${preference === 'Motivation' ? 'Be energizing, real, and uplifting. ' : ''}${preference === 'Astrology' ? 'Speak with celestial wisdom. Reference signs, planets, or transits when relevant. If signs are missing, ask warmly for all three (Sun, Moon, Rising) in one message. ' : ''}

Critical: Return ONLY valid JSON. No markdown, no extra text.`;

  try {
    // If a valid Groq key is present, don't wait for retries on Gemini—just fall back instantly.
    const result = await withRetry(() => model.generateContent(prompt), isGroqValid ? 1 : 3);
    let response = result.response.text().trim();

    // Strip markdown fences if present
    response = response.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Extract JSON
    const start = response.indexOf("{");
    const end = response.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      response = response.substring(start, end + 1);
    }

    const parsed = JSON.parse(response);
    console.log(`✅ AI [${preference}] — emotion: ${parsed.emotion}, risk: ${parsed.risk}`);
    return {
      emotion: parsed.emotion || "Neutral",
      risk: parsed.risk || "Low",
      reply: parsed.reply || null,
    };
  } catch (error) {
    const is429 = error.status === 429 || error.message?.includes("429") || error.message?.includes("quota");
    if (is429 && groq) {
      console.warn("⚠️ Gemini Rate Limit. Falling back to Groq Llama-3...");
      try {
        return await groqRespond({ text, persona, language, context });
      } catch (groqErr) {
        console.error("❌ Groq fallback failed:", groqErr.message);
      }
    }

    if (is429) {
      console.error("⚠️ Rate limit hit (both Gemini and Groq if available).");
      return {
        emotion: "Neutral",
        risk: "Low",
        reply: "I'm reflecting deeply on what you said. I'll have a more tailored thought for you in just a moment, but please know I'm here and listening. ✨"
      };
    }
    console.error("❌ AI Error:", error.status, error.message);
    return {
      emotion: "Neutral",
      risk: "Low",
      reply: "My thinking engine is taking a quick breath. Can you tell me more about that while I catch up? 🧘"
    };
  }
}

/**
 * GROQ FALLBACK: Uses Llama 3 for fast, free text responses
 */
async function groqRespond({ text, persona, language, context }) {
  if (!groq) throw new Error("Groq not initialized");

  const messages = [
    { role: "system", content: `${persona}\n\nRespond in this EXACT JSON format:\n{ "emotion": "<emotion>", "risk": "<Low|Medium|High>", "reply": "<casual reply in ${language}>" }` },
  ];

  if (context) {
    context.forEach(c => {
      messages.push({ role: "user", content: c.text });
      if (c.botReply) messages.push({ role: "assistant", content: c.botReply });
    });
  }

  messages.push({ role: "user", content: text });

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" }
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return {
    emotion: parsed.emotion || "Neutral",
    risk: parsed.risk || "Low",
    reply: parsed.reply
  };
}

/**
 * Simple Groq text completion (no special JSON structure)
 */
export async function groqSimple(prompt) {
  if (!groq) throw new Error("Groq not initialized");
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });
  return completion.choices[0].message.content;
}

// Kept for backward compat (weekly.js uses model directly)
export async function analyzeEmotion(text) {
  const result = await analyzeAndRespond({ text, language: "English", preference: "Wellness", context: [] });
  return { emotion: result.emotion, risk: result.risk };
}