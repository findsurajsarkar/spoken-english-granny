# Spoken English Granny 👵

Practise speaking English with a kind granny who never laughs at your mistakes.

Granny gives you a fresh topic, you speak about it, and she checks your "notebook" with a red pen:
mistakes are circled, the correction is written above, and each one is explained in simple words
(English, Hinglish or Hindi). At the end you get marks out of 10, a grade and a loving remark.

## Features

- **Landing page** (`#/`) with how it works, features, pricing and FAQ. Returning learners go straight to the app.
- **Practice** (`#/practice`): a new AI topic every time for your level (Beginner / Intermediate / Advanced);
  the AI also decides how long you should speak (45 s – 3 min). Speak with the mic or type.
- **Talk** (`#/talk`): 8 role-play conversations (Chat with Granny, Ordering food, Shopping free;
  Job interview, Office small talk, Doctor, Airport, Customer care with Plus). Granny reads her replies aloud,
  never interrupts, and marks your English at the end.
- **Teacher's notebook result**: red circles, handwritten corrections, numbered jargon-free notes
  (English, Hinglish or Hindi), the corrected version with a 🔊 listen button, strengths and a tip.
- **Marks out of 10**: 0–2 Very Bad · 3–4 Bad · 5–6 Good · 7–8 Very Good · 9–10 Excellent.
- **Badges** (`#/badges`): 17 badges plus lifetime stats (practices, conversations, words, streaks).
- **History** (`#/history`): past notebook pages, kept 60 days. GitHub-style attendance grid with streaks.

## Plans

| | Free | Plus Monthly | Plus Lifetime |
|---|---|---|---|
| Price | ₹0 | ₹99 / month | ₹2,999 one time |
| Practices a day | 3 | 6 | 6 |
| Conversations | 3 everyday ones | all 8 | all 8 |

Limits and prices live in `src/lib/plan.ts`.

### Payments (Razorpay)

Create a `.env` file with your Razorpay key to take real payments:

```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

Without a key, payments run in test mode: `npm run dev` shows a "Test upgrade (no payment)" button, and a
production build shows "Coming soon". **Before charging real money**, add a small server function that
creates Razorpay orders and verifies payment signatures — Plus status is currently stored in the browser.

## How the AI works (no API keys)

All AI runs through [Puter.js](https://github.com/HeyPuter/puter) (loaded in `index.html`).
Puter uses a *user-pays* model: each learner signs in once with a free Puter account and the
usage comes from their own Puter allowance. The app owner never pays for or manages AI credits.

- Topics: `puter.ai.chat` (Puter's default model)
- English check: `puter.ai.chat` with `claude-sonnet-5` (falls back to the default model)
- Transcription fallback: `puter.ai.speech2txt`

Streaks, history and settings are stored in the browser's `localStorage` (clearing site data resets them).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. Build for production with `npm run build` (output in `dist/`, static files — host anywhere:
Vercel, Netlify, GitHub Pages, Puter hosting).

## Project layout

```
src/
  App.tsx                 screens + flow (home → practice → checking → result, history)
  components/
    Landing.tsx           public landing page with pricing and FAQ
    PracticeFlow.tsx      home → topic → speaking → checking → result
    Home.tsx              greeting, level + explanation language, start button, streak grid
    Practice.tsx          topic card, mic with countdown ring, transcript review
    Talk.tsx              scenario picker and the voice conversation
    Notebook.tsx          ruled page with red-pen circles and corrections
    Result.tsx            marks, grade, remark, notes, corrected text, new badges
    Badges.tsx            badges and lifetime stats
    Plus.tsx, Pricing.tsx Granny Plus page and pricing cards
    StreakGrid.tsx        attendance grid and streak stats
    History.tsx           past attempts
  hooks/useRecorder.ts    MediaRecorder + live SpeechRecognition
  lib/
    granny.ts             AI prompts: topics, English checking, conversation replies
    scenarios.ts          conversation scenarios
    badges.ts             badge definitions
    plan.ts, payments.ts  free/Plus limits, prices, Razorpay checkout
    router.ts             tiny hash router
    puter.ts              Puter.js wrapper (sign-in, chat → JSON, speech-to-text)
    storage.ts            localStorage: history, attendance days, stats, badges, settings
    grading.ts            score → grade label
```

## Making it a mobile app later

The app is a responsive PWA (installable from the browser). To ship to the Play Store / App Store,
wrap it with [Capacitor](https://capacitorjs.com/): `npm i @capacitor/core @capacitor/cli`,
`npx cap init`, `npx cap add android`, then `npm run build && npx cap sync`.
Notes: inside the app webview live transcription is not available, so the Puter transcription fallback is used,
and the microphone permission must be added to the Android/iOS manifests.
