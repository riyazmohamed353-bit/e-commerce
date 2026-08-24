// backend/src/services/geminiService.js

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const BASE_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(parts) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `${BASE_URL}?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      const text = await res.text();

      // Temporary Gemini server overload
      if (res.status === 503 || res.status === 429) {
        lastError = new Error(
          `Gemini temporarily unavailable (${res.status})`
        );

        if (attempt < MAX_RETRIES) {
          console.log(
            `Gemini unavailable. Retry ${attempt}/${MAX_RETRIES}...`
          );

          // 2 sec, 4 sec, 6 sec
          await sleep(attempt * 2000);
          continue;
        }

        throw lastError;
      }

      if (!res.ok) {
        throw new Error(
          `Gemini API error ${res.status}: ${text}`
        );
      }

      const data = JSON.parse(text);

      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('Gemini returned no content');
      }

      // Sometimes Gemini wraps JSON in ```json
      const cleaned = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleaned);

    } catch (err) {
      lastError = err;

      if (attempt < MAX_RETRIES) {
        console.log(
          `Gemini request failed. Retry ${attempt}/${MAX_RETRIES}:`,
          err.message
        );

        await sleep(attempt * 2000);
      }
    }
  }

  throw lastError || new Error('Gemini request failed');
}


// ======================================================
// 1. AI PRICE ESTIMATION
// ======================================================

async function estimatePrice({
  title,
  brand,
  model,
  specs,
  conditionText,
  referenceListings,
}) {
  const prompt = `
You are a pricing assistant for a used electronics marketplace in India.

Estimate a fair resale price range in INR.

Device:
Title: ${title}
Brand: ${brand}
Model: ${model}

Specifications:
${JSON.stringify(specs)}

Seller condition:
${conditionText}

Recent comparable listings:
${JSON.stringify(referenceListings || [])}

Use the comparable listings as the main reference.

Return ONLY valid JSON:

{
  "low": number,
  "high": number,
  "recommended": number,
  "reasoning": "short explanation"
}
`;

  return callGemini([
    {
      text: prompt,
    },
  ]);
}


// ======================================================
// 2. AI PHOTO CONDITION CHECK
// ======================================================

async function assessConditionFromPhotos({
  photosBase64,
  mimeType = 'image/jpeg',
}) {
  const parts = [
    {
      text: `
You are inspecting photos of a used electronic device.

Look for:

- scratches
- cracks
- dents
- screen damage
- broken parts
- missing parts
- visible physical damage

Give a condition score.

100 = excellent
80-99 = very good
60-79 = good
40-59 = fair
0-39 = poor

Return ONLY valid JSON:

{
  "score": number,
  "issues": ["issue 1", "issue 2"]
}
`,
    },

    ...photosBase64.map(base64 => ({
      inlineData: {
        mimeType,
        data: base64,
      },
    })),
  ];

  return callGemini(parts);
}


// ======================================================
// 3. AI SEARCH PARSER
// ======================================================

async function parseSearchQuery(query) {
  const prompt = `
Convert this shopping request into marketplace filters.

Request:
"${query}"

Allowed categories:

phone
laptop
tablet
smartwatch
camera
other

Return ONLY valid JSON.

Use this structure:

{
  "category": "string",
  "maxPrice": number,
  "minPrice": number,
  "brand": "string",
  "minRam": "string",
  "gpu": "string",
  "keywords": []
}

Only include fields that are relevant.
`;

  return callGemini([
    {
      text: prompt,
    },
  ]);
}


// ======================================================
// 4. AI NEGOTIATION
// ======================================================

async function suggestNegotiation({
  sellerPrice,
  aiEstimate,
  conditionScore,
}) {
  const prompt = `
A buyer wants to negotiate a used electronics listing.

Seller asking price:
₹${sellerPrice}

AI estimated fair price:
₹${aiEstimate}

Condition score:
${conditionScore}/100

Suggest:

1. Fair opening offer
2. Maximum reasonable offer
3. Short polite message

Return ONLY valid JSON:

{
  "offerLow": number,
  "offerHigh": number,
  "message": "short polite message"
}
`;

  return callGemini([
    {
      text: prompt,
    },
  ]);
}


module.exports = {
  estimatePrice,
  assessConditionFromPhotos,
  parseSearchQuery,
  suggestNegotiation,
};