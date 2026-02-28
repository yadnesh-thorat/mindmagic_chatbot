import { Entry, WeeklyReport } from "./models.js";
import { model, withRetry, groqSimple, isGroqValid } from "./ai.js";

export async function generateWeekly(userId, language) {
  const entries = await Entry.find({ userId });

  if (entries.length < 3) return null;

  const combined = entries.map(e => e.text).join("\n");

  const prompt = `
You're a caring friend looking back at what I've shared this week. 
Write a simple, warm, and supportive summary of my feelings in ${language}.
Use easy English words and a natural, casual tone. 
Gently point out any patterns you see without being medical or formal.
Keep it short and friendly.

Entries:
${combined}
`;

  let summary;
  try {
    const result = await withRetry(() => model.generateContent(prompt), isGroqValid ? 1 : 3);
    summary = result.response.text().trim();
  } catch (error) {
    if (isGroqValid) {
      try {
        summary = await groqSimple(prompt);
      } catch (e) {
        summary = "Reflecting deeply... you're doing great! ✨";
      }
    } else {
      summary = "Deep analysis engine is resting. Keep sharing! ✨";
    }
  }

  return await WeeklyReport.create({ userId, summary });
}