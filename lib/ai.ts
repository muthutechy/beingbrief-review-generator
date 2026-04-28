import { GoogleGenerativeAI } from "@google/generative-ai";

function getGemini() {
  console.log("ENV KEY:", process.env.GEMINI_API_KEY);
  const key = process.env.GEMINI_API_KEY;

  if (!key || key.trim() === "") {
    console.log("Gemini API key missing. Using fallback reviews.");
    return null;
  }

  return new GoogleGenerativeAI(key);
}

function cleanGeminiJson(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export async function analyzeBusiness(input: {
  name: string;
  category: string;
  city: string;
  services: string[];
  locations: string[];
}) {
  const fallback = {
    serviceKeywords: input.services,
    locationKeywords: input.locations.length ? input.locations : [input.city],
    naturalQuestions: [
      "What service did you use?",
      "What did you like most?",
      "Was the team professional?",
      "Was the work completed properly?"
    ],
    safetyRules: [
      "Only write based on real experience.",
      "Do not add fake claims.",
      "Do not overuse keywords.",
      "Do not make the review sound like an advertisement."
    ]
  };

  const genAI = getGemini();

  if (!genAI) {
    return fallback;
  }

  try {
    console.log("Using Gemini for business analysis");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
Analyze this local business for an ethical review generator tool.

Return JSON only. Do not use markdown.

Business Name: ${input.name}
Category: ${input.category}
City: ${input.city}
Services: ${input.services.join(", ")}
Locations: ${input.locations.join(", ")}

Return this exact JSON structure:
{
  "serviceKeywords": [],
  "locationKeywords": [],
  "naturalQuestions": [],
  "safetyRules": []
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = cleanGeminiJson(text);

    return JSON.parse(clean);
  } catch (error) {
    console.log("Gemini business analysis failed. Using fallback:", error);
    return fallback;
  }
}

export async function generateReviews(input: {
  business: string;
  service: string;
  location: string;
  rating: number;
  experiencePoints: string[];
  language: string;
  tone: string;
  length: string;
}) {
  const fallback = {
    short: `Good experience with ${input.service}. Work done properly.`,
    medium: `I had a good experience with ${input.business}. The service was handled professionally.`,
    casual: `Nice service overall.`,
    warnings: ["AI fallback used. Check GEMINI_API_KEY if you expected AI output."]
  };

  const genAI = getGemini();

  if (!genAI) {
    return fallback;
  }

  try {
    console.log("Using Gemini for review generation");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
You are helping a real customer write a Google review based only on their selected real experience.

Important rules:
- Do NOT create fake claims.
- Do NOT sound like marketing.
- Do NOT overuse keywords.
- Do NOT repeat the same sentence structure.
- Do NOT use too polished language.
- Write like a normal real customer.
- Use simple natural words.
- Include service and location only if it feels natural.
- Use the selected experience points naturally.
- Make all 3 reviews different.
- Reflect the rating honestly.
- If rating is 1, 2, or 3, do not force positive wording.
- Return JSON only.
- Do not use markdown.

Business: ${input.business}
Service: ${input.service}
Location: ${input.location}
Rating: ${input.rating}
Experience Points: ${input.experiencePoints.join(", ")}
Language: ${input.language}
Tone: ${input.tone}
Length: ${input.length}

Return this exact JSON structure:
{
  "short": "",
  "medium": "",
  "casual": "",
  "warnings": []
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = cleanGeminiJson(text);

    return JSON.parse(clean);
  } catch (error) {
    console.log("Gemini review generation failed. Using fallback:", error);
    return fallback;
  }
}