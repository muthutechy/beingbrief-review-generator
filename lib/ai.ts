import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeBusiness(input: {
  name: string;
  category: string;
  city: string;
  services: string[];
  locations: string[];
}) {
  if (!process.env.OPENAI_API_KEY) {
    return {
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
  }

  const prompt = `
Analyze this local business and return JSON only.

Business: ${input.name}
Category: ${input.category}
City: ${input.city}
Services: ${input.services.join(", ")}
Locations: ${input.locations.join(", ")}

Return:
{
 "serviceKeywords": [],
 "locationKeywords": [],
 "naturalQuestions": [],
 "safetyRules": []
}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content || "{}");
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
  if (!process.env.OPENAI_API_KEY) {
    return {
      short: `Good experience with ${input.service}. The team was professional and the work was done properly.`,
      medium: `I had a good experience with ${input.business} for ${input.service}. The team handled the work neatly and explained things clearly. Overall, I am satisfied with the service.`,
      casual: `Nice experience overall. The service was done well, and the team was helpful.`
    };
  }

  const prompt = `
You are helping a real customer write a Google review based only on their actual experience.

Rules:
- Do not create fake claims.
- Do not sound like marketing.
- Do not repeat sentence structure.
- Use simple natural customer language.
- Include service and location only if natural.
- Reflect the rating tone.
- Do not overuse keywords.
- Generate JSON only.

Business: ${input.business}
Service: ${input.service}
Location: ${input.location}
Rating: ${input.rating}
Experience: ${input.experiencePoints.join(", ")}
Language: ${input.language}
Tone: ${input.tone}
Length: ${input.length}

Return:
{
 "short": "",
 "medium": "",
 "casual": "",
 "warnings": []
}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}
