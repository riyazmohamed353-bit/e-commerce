// All Gemini calls happen ONLY on the backend.
// The mobile app never sees or holds the API key.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(parts) {
  const res = await fetch(`${BASE_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');
  return JSON.parse(text);
}

// 1. Price estimation - grounded with a few reference listings so the model
// isn't just guessing from memory.
async function estimatePrice({ title, brand, model, specs, conditionText, referenceListings }) {
  const prompt = `
You are a pricing assistant for a used electronics marketplace in India.
Estimate a fair resale price range in INR for this device.

Device: ${title}
Brand: ${brand}, Model: ${model}
Specs: ${JSON.stringify(specs)}
Condition described by seller: ${conditionText}

Reference - recent comparable listings (use these as your main grounding,
do not rely on outdated general knowledge of prices):
${JSON.stringify(referenceListings || [])}

Respond ONLY with JSON in this exact shape:
{"low": number, "high": number, "recommended": number, "reasoning": "short 1-2 sentence explanation"}
`;
  return callGemini([{ text: prompt }]);
}

// 2. Photo condition scoring - multimodal call with inline base64 images
async function assessConditionFromPhotos({ photosBase64, mimeType = 'image/jpeg' }) {
  const parts = [
    {
      text: `You are inspecting photos of a used electronic device for a resale marketplace.
Look for scratches, cracks, dents, screen damage, or missing parts.
Respond ONLY with JSON in this exact shape:
{"score": number (0-100, 100 = perfect condition), "issues": ["short issue description", ...]}`,
    },
    ...photosBase64.map((b64) => ({
      inlineData: { mimeType, data: b64 },
    })),
  ];
  return callGemini(parts);
}

// 3. Natural language search -> structured filters
async function parseSearchQuery(query) {
  const prompt = `
Convert this natural language shopping request into structured search filters
for a used electronics marketplace.

Request: "${query}"

Respond ONLY with JSON in this exact shape (omit fields that don't apply):
{"category": string, "maxPrice": number, "minPrice": number, "brand": string,
 "minRam": string, "gpu": string, "keywords": [string]}
`;
  return callGemini([{ text: prompt }]);
}

// 4. Negotiation suggestion
async function suggestNegotiation({ sellerPrice, aiEstimate, conditionScore }) {
  const prompt = `
A buyer is considering a used electronics listing.
Seller's asking price: ₹${sellerPrice}
AI estimated fair price: ₹${aiEstimate}
Condition score: ${conditionScore}/100

Suggest a fair opening offer range and a short, polite one-sentence message
the buyer could send the seller.

Respond ONLY with JSON in this exact shape:
{"offerLow": number, "offerHigh": number, "message": "short polite message"}
`;
  return callGemini([{ text: prompt }]);
}

module.exports = {
  estimatePrice,
  assessConditionFromPhotos,
  parseSearchQuery,
  suggestNegotiation,
};
