import { GoogleGenerativeAI } from "@google/generative-ai";

function getGemini() {
  const key = process.env.GEMINI_API_KEY;

  if (!key || key.trim() === "") return null;

  return new GoogleGenerativeAI(key);
}

export async function analyzeBusiness(input: any) {
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
      "Do not overuse keywords."
    ]
  };

  const genAI = getGemini();
  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Return JSON only.

Business: ${input.name}
Category: ${input.category}
City: ${input.city}
Services: ${input.services.join(", ")}
Locations: ${input.locations.join(", ")}

{
 "serviceKeywords": [],
 "locationKeywords": [],
 "naturalQuestions": [],
 "safetyRules": []
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);
  } catch (err) {
    console.log("Gemini failed", err);
    return fallback;
  }
}

export async function generateReviews(input: any) {
  const fallback = {
    short: `Good experience with ${input.service}. Work done properly.`,
    medium: `I had a good experience with ${input.business}. The service was handled professionally.`,
    casual: `Nice service overall.`,
    warnings: []
  };

  const genAI = getGemini();
  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Generate 3 natural customer reviews in JSON.

Business: ${input.business}
Service: ${input.service}
Location: ${input.location}
Rating: ${input.rating}

{
 "short": "",
 "medium": "",
 "casual": "",
 "warnings": []
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);
  } catch (err) {
    console.log("Gemini failed", err);
    return fallback;
  }
}