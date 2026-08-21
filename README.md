# ReTech AI — Full Source (React Native + Node/Express + MongoDB + Gemini)

AI-powered marketplace for used electronics. Full-stack source code:
`/backend` = Node/Express API + MongoDB, `/mobile` = React Native (Expo) app.

## Folder Structure

```
retech-ai/
├── backend/
│   ├── server.js                  # entry point, also runs Socket.io for chat
│   ├── .env.example                # copy to .env and fill in
│   └── src/
│       ├── config/db.js            # MongoDB connection
│       ├── models/                 # User, Listing, Message (Mongoose schemas)
│       ├── middleware/auth.js      # JWT auth guard
│       ├── services/geminiService.js  # ALL Gemini API calls live here
│       ├── controllers/            # request handlers
│       └── routes/                 # /api/auth, /api/listings, /api/ai, /api/chat
│
└── mobile/
    ├── App.js
    ├── app.json
    └── src/
        ├── api/client.js           # axios instance, attaches JWT
        ├── context/AuthContext.js  # login/register/logout state
        ├── navigation/AppNavigator.js
        ├── screens/                # Login, Register, Home, Search, CreateListing,
        │                           # ListingDetail, Chat
        └── components/ListingCard.js
```

## 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGO_URI` — free cluster at https://www.mongodb.com/cloud/atlas/register
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — free key at https://aistudio.google.com/apikey (no card required)

```bash
npm run dev
```

Backend runs at `http://localhost:5000`. Test it: `curl http://localhost:5000`.

**Deploying it so your phone can reach it:** for development, run it on Render.com
or Railway.app (both have free tiers) so you don't have to fight with local
network/firewall issues from your phone. Both take an `.env` file the same way.

## 2. Mobile App Setup

```bash
cd mobile
npm install
```

Edit `src/api/client.js` and set `BASE_URL` to your backend's URL
(e.g. `https://your-app.onrender.com/api`, or your LAN IP if running locally
with Expo Go — `http://192.168.x.x:5000/api`).

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your Android phone. That's the
fastest way to test without setting up the full Android build toolchain.

To build a real installable APK later: `npx eas build -p android --profile preview`
(needs a free Expo/EAS account).

## 3. Where the AI Actually Happens

All Gemini calls are in `backend/src/services/geminiService.js`, called only from
the backend — the API key never touches the mobile app or the APK.

| Feature | Endpoint | Model call |
|---|---|---|
| AI Fair Price | `POST /api/ai/price-estimate` | Gemini text, grounded with real listings from Mongo |
| Photo Condition Check | `POST /api/ai/condition-check` | Gemini multimodal (images) |
| Smart Search (NL → filters) | `POST /api/ai/search-parse` | Gemini text → structured JSON |
| Negotiation Assistant | `POST /api/ai/negotiate` | Gemini text |
| Trust Score | *(none — pure math)* | `User.getTrustScore()` in `models/User.js` |
| Fraud Flag | *(none — rule-based)* | inside `aiController.priceEstimate` |

## 4. Gemini Free Tier Notes (2026)

- Free tier: Gemini 2.5 Flash / Flash-Lite give roughly 10–15 requests/minute
  and up to ~1,500 requests/day, no credit card required.
- Gemini 2.5 Pro's free tier is much more restricted (~5 RPM / ~50 RPD) —
  this project intentionally uses Flash, not Pro.
- **Do not enable billing on the same Google Cloud project you're using for
  free-tier testing** — it removes the free tier entirely for that project.
  Keep a separate project if you plan to eventually pay.
- Every AI result gets cached onto the `Listing` document in MongoDB
  (`aiEstimate`, `aiCondition` fields) so the same listing never re-triggers
  a Gemini call twice — this is what keeps you inside the free daily quota.

## 5. What's Deliberately Left as a TODO

To keep this a buildable starting point rather than an unmanageable dump:
- Photo uploads currently store local `file://` URIs — swap in Firebase
  Storage or Cloudinary upload before going to production, then store the
  returned URL instead.
- No push notifications yet (add Expo Notifications + FCM).
- No payment/escrow flow.
- No image moderation (add before allowing public photo uploads).

## 6. Next Steps

1. `npm install` in both folders, get MongoDB + Gemini keys, run backend.
2. Point the mobile app at your backend URL, run `npx expo start`.
3. Register a user, create a listing, tap "Get AI Price Estimate" to confirm
   your Gemini key works end-to-end.
