/* Demo mode for recording product videos and testing the UI without an AI account.
 * Only available in development builds (npm run dev) and only when the page sets
 * window.__GRANNY_DEMO__ = true before loading. It never ships to the live site. */

export const isDemo = () => import.meta.env.DEV && typeof window !== 'undefined' && Boolean((window as any).__GRANNY_DEMO__);

const store = new Map<string, unknown>();

export const demoKv = {
  get: async (k: string) => store.get(k) ?? null,
  set: async (k: string, v: unknown) => (store.set(k, v), true),
  del: async (k: string) => store.delete(k),
  list: async (prefix: string) => [...store.entries()].filter(([k]) => k.startsWith(prefix)).map(([key, value]) => ({ key, value })),
};

const TOPIC = {
  title: 'A festival you love',
  prompt: 'Beta, tell Granny about a festival you love and how your family celebrates it.',
  promptHindi: 'बेटा, अपने पसंदीदा त्योहार के बारे में बताओ।',
  hints: ['Which festival is it?', 'What do you eat and do?', 'Why is it special to you?'],
  seconds: 90,
};

const TOPIC_CHECK = {
  score: 6,
  sentenceLevel: 'moderate',
  mistakes: [
    { wrong: 'I go', right: 'I went', why: "It happened last Diwali, so 'go' becomes 'went'. Old stories wear old clothes!", kind: 'tense' },
    { wrong: 'grandmother village', right: "grandmother's village", why: "The village belongs to your grandmother, so add 's: grandmother's village.", kind: 'grammar' },
    { wrong: 'We was', right: 'We were', why: "With 'we', always say 'were', never 'was'.", kind: 'grammar' },
    { wrong: 'I eat', right: 'I ate', why: "Again it's the past, so 'eat' becomes 'ate'.", kind: 'tense' },
    { wrong: 'too much sweets', right: 'too many sweets', why: "You can count sweets, so say 'many'. 'Much' is for things like sugar or water.", kind: 'word' },
    { wrong: 'most happiest', right: 'happiest', why: "'Happiest' already means 'most happy', so don't add 'most'.", kind: 'extra' },
  ],
  correctedText:
    "Last Diwali I went to my grandmother's village. We were lighting diyas and I ate too many sweets. It was the happiest day of my year.",
  remark:
    'Beta, what a lovely Diwali story! Your sentences were nicely connected. A few small words slipped, mostly about the past, but Granny could feel your happiness.',
  strengths: ['You told the story in a clear order', 'Lovely words like "lighting diyas"'],
  tip: 'When you talk about something that already happened, change the action word: go → went, eat → ate.',
};

const TALK_CHECK = {
  score: 7,
  sentenceLevel: 'moderate',
  mistakes: [
    { wrong: 'I am having', right: 'I have', why: "For experience you own, just say 'I have'. 'I am having' is for things happening right now, like lunch!", kind: 'natural' },
    { wrong: 'two years experience', right: 'two years of experience', why: "Add 'of': two years of experience.", kind: 'missing' },
    { wrong: 'discuss about the problem', right: 'discussed the problem', why: "It already happened, so 'discussed'. And 'discuss' never needs 'about' after it.", kind: 'extra' },
  ],
  correctedText:
    'I have two years of experience in sales. I like talking to customers and solving their problems. Once a customer was angry about a late delivery, so I listened calmly, discussed the problem and gave him a discount.',
  remark:
    'Very good, beta! You answered like a real professional and your story about the angry customer was clear. Fix these few small habits and you will shine in any interview.',
  strengths: ['Clear, confident answers', 'You gave a real example'],
  tip: "In interviews, say 'I have … experience', never 'I am having'.",
};

const REPLIES = [
  "That's great experience! What do you enjoy most about working in sales?",
  'Wonderful. Can you tell me about a time you handled a difficult customer?',
  'Thank you, that was a very good answer. We will be in touch soon. All the best!',
];
let reply = 0;

export async function demoAsk(prompt: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 1200));
  if (prompt.includes('fresh speaking topic')) return JSON.stringify(TOPIC);
  if (prompt.includes('checking their notebook')) return JSON.stringify(prompt.includes('Job interview') ? TALK_CHECK : TOPIC_CHECK);
  return REPLIES[reply++ % REPLIES.length];
}
