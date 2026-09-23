/* Everything Granny asks the AI lives here: new topics and checking the learner's English. */
import { askJSON, askText } from './puter';
import type { Scenario } from './scenarios';
import type { Analysis, ExplainLang, Level, Mistake, Topic, Turn } from './types';

const TIME_RANGE: Record<Level, [number, number]> = {
  beginner: [45, 90],
  intermediate: [75, 150],
  advanced: [120, 180],
};

const LEVEL_GUIDE: Record<Level, string> = {
  beginner: 'very simple, personal, everyday topics (family, food, my day, hobbies). Short easy words.',
  intermediate: 'everyday situations and opinions that need a few connected sentences (travel, work, festivals, a memorable event).',
  advanced: 'topics that need opinions, reasons and comparisons (technology, society, education, the environment, a debate).',
};

const LANG_GUIDE: Record<ExplainLang, string> = {
  english: 'very simple English, like talking to a 10-year-old',
  hindi: 'simple everyday Hindi in Devanagari script (keep the English words being discussed in English, inside quotes)',
  hinglish: 'simple Hinglish written in Roman script (e.g. "Yahan \'goes\' aayega, kyunki...")',
};

// Used only if the AI can't be reached for a topic.
const FALLBACK: Record<Level, Array<Pick<Topic, 'title' | 'prompt' | 'hints'>>> = {
  beginner: [
    { title: 'My favourite food', prompt: 'Tell Granny about the food you love the most.', hints: ['What is it?', 'Who makes it?', 'When do you eat it?'] },
    { title: 'My morning', prompt: 'Describe what you did this morning.', hints: ['When did you wake up?', 'What did you eat?', 'Where did you go?'] },
    { title: 'My best friend', prompt: 'Talk about your best friend.', hints: ['What is their name?', 'How did you meet?', 'What do you do together?'] },
  ],
  intermediate: [
    { title: 'A festival I love', prompt: 'Describe a festival you enjoy and how you celebrate it.', hints: ['Which festival?', 'What do you do that day?', 'Why do you like it?'] },
    { title: 'A trip I remember', prompt: 'Tell Granny about a journey you will never forget.', hints: ['Where did you go?', 'Who was with you?', 'What happened?'] },
    { title: 'My dream job', prompt: 'What job would you love to do one day, and why?', hints: ['What is the job?', 'What would a day look like?', 'What do you need to learn?'] },
  ],
  advanced: [
    { title: 'Phones and children', prompt: 'Should young children have their own smartphones? Share your opinion.', hints: ['Benefits?', 'Dangers?', 'What would you suggest to parents?'] },
    { title: 'City life vs village life', prompt: 'Compare living in a big city with living in a village.', hints: ['Opportunities?', 'Peace and health?', 'Where would you choose to live?'] },
    { title: 'Learning from failure', prompt: 'Talk about a time you failed and what it taught you.', hints: ['What happened?', 'How did you feel?', 'What changed after?'] },
  ],
};

function clampSeconds(level: Level, s: unknown): number {
  const [min, max] = TIME_RANGE[level];
  const n = Number(s);
  if (!Number.isFinite(n)) return Math.round((min + max) / 2 / 15) * 15;
  return Math.min(max, Math.max(min, Math.round(n / 15) * 15));
}

export async function newTopic(level: Level, avoid: string[]): Promise<Topic> {
  const [min, max] = TIME_RANGE[level];
  const prompt = `You are "Granny", a warm, loving grandmother who helps people practise SPOKEN English.
Learners are mostly Indian (Hindi speakers learning English) but can be anyone.

Create ONE fresh speaking topic for a ${level.toUpperCase()} learner: ${LEVEL_GUIDE[level]}
It must be relatable, kind and culturally inclusive. Nothing political, religious-controversial or upsetting.
Do NOT repeat or closely resemble any of these recent topics: ${avoid.length ? avoid.map((t) => `"${t}"`).join(', ') : 'none'}.
Random seed for variety: ${Math.random().toString(36).slice(2, 8)}.

Also decide how many seconds the learner should speak about it (between ${min} and ${max}), based on how much there is to say.

Reply with ONLY this JSON, no other text:
{"title": "max 7 words", "prompt": "1-2 friendly sentences inviting them to talk, in Granny's voice", "promptHindi": "the same invitation in simple Hindi (Devanagari)", "hints": ["3 short guiding questions"], "seconds": number}`;

  try {
    const t = await askJSON<Partial<Topic>>(prompt);
    if (!t.title || !t.prompt) throw new Error('empty topic');
    return {
      title: String(t.title),
      prompt: String(t.prompt),
      promptHindi: t.promptHindi ? String(t.promptHindi) : undefined,
      hints: Array.isArray(t.hints) ? t.hints.slice(0, 4).map(String) : [],
      seconds: clampSeconds(level, t.seconds),
      level,
    };
  } catch (err) {
    console.warn('Topic generation failed, using a built-in topic', err);
    const pool = FALLBACK[level].filter((f) => !avoid.includes(f.title));
    const pick = (pool.length ? pool : FALLBACK[level])[Math.floor(Math.random() * (pool.length || FALLBACK[level].length))];
    return { ...pick, seconds: clampSeconds(level, NaN), level };
  }
}

export async function checkEnglish(topic: Topic, transcript: string, lang: ExplainLang): Promise<Analysis> {
  const prompt = `You are "Granny", a loving grandmother and a very good English teacher. Your grandchild just SPOKE about a topic
and you are checking their notebook with a red pen. You never mock, never shame, never use difficult words.

Topic: "${topic.title}" — ${topic.prompt}
Learner level they chose: ${topic.level}

What they said (a speech-to-text transcript):
"""
${transcript}
"""

HOW TO CHECK
- It is SPOKEN English turned into text: ignore punctuation, capital letters, filler words (um, uh, like) and obvious speech-to-text glitches.
- Only mark real mistakes: wrong grammar, wrong word, wrong tense, wrong word order, a missing or extra word, or a phrase that sounds wrong/unnatural to a native speaker (e.g. "I am having a car", "cousin brother", "revert back", "discuss about").
- "wrong" MUST be copied EXACTLY, character for character, from the transcript: the SHORTEST piece (1-6 words) that contains the mistake. List mistakes in the order they appear. No overlapping pieces. Mark each mistake once.
- "right" is what they should say instead of that exact piece (use "" only if the words should simply be removed).
- "why": explain like a granny to a child, in ${LANG_GUIDE[lang]}. Max 2 short sentences. NO grammar jargon at all
  (never say: subject-verb agreement, article, preposition, participle, tense names, auxiliary, clause, etc.).
  Where possible add a tiny memory trick.
- "kind": one of "grammar", "word", "tense", "order", "missing", "extra", "natural".

SCORE (whole number 0-10)
- Think about BOTH how many/how serious the mistakes are compared to how much they said, AND how difficult their sentences were.
  Long, rich sentences with a few small mistakes deserve MORE than tiny simple sentences with none.
- Fewer than 20 words spoken: at most 6. Empty or not English: 0.
- 0-2 very bad, 3-4 bad, 5-6 good, 7-8 very good, 9-10 excellent.

Write "remark", "strengths" and "tip" in ${LANG_GUIDE[lang]}, in Granny's warm voice (e.g. "Beta, ...").
The remark (2-3 sentences) should say how difficult their sentences were and how good their English was, honestly but kindly.

Reply with ONLY this JSON, no other text:
{"score": number, "sentenceLevel": "simple" | "moderate" | "complex",
 "mistakes": [{"wrong": "...", "right": "...", "why": "...", "kind": "..."}],
 "correctedText": "the whole thing rewritten in correct, natural English (keep their meaning and style)",
 "remark": "...", "strengths": ["1-3 short things they did well"], "tip": "one practical tip for next time"}`;

  const a = await askJSON<Partial<Analysis>>(prompt, true);
  const mistakes: Mistake[] = Array.isArray(a.mistakes)
    ? a.mistakes
        .filter((m) => m && typeof m.wrong === 'string' && m.wrong.trim())
        .map((m) => ({ wrong: m.wrong.trim(), right: String(m.right ?? '').trim(), why: String(m.why ?? ''), kind: String(m.kind ?? 'grammar') }))
    : [];
  const score = Math.max(0, Math.min(10, Math.round(Number(a.score) || 0)));
  return {
    score,
    sentenceLevel: String(a.sentenceLevel ?? 'simple'),
    mistakes,
    correctedText: String(a.correctedText ?? transcript),
    remark: String(a.remark ?? ''),
    strengths: Array.isArray(a.strengths) ? a.strengths.map(String).slice(0, 3) : [],
    tip: String(a.tip ?? ''),
  };
}

/* ---------- conversation mode ---------- */

export async function nextReply(scenario: Scenario, level: Level, turns: Turn[], turnsLeft: number): Promise<string> {
  const history = turns.map((t) => `${t.who === 'granny' ? 'YOU' : 'LEARNER'}: ${t.text}`).join('\n');
  const prompt = `You are helping an English learner practise SPEAKING through a role-play. They hear your reply read aloud.
Your role: ${scenario.role}
Learner level: ${level} (${LEVEL_GUIDE[level]})

Rules:
- Stay in your role. Be warm, patient and encouraging. Never mock.
- Reply in 1-3 short, natural spoken sentences (max 45 words), using English that suits their level.
- Do NOT correct their English now — Granny gives feedback at the end.
- ${turnsLeft > 0 ? 'End with ONE simple question or prompt so they keep talking.' : 'This is the LAST reply: wrap up warmly in 1-2 sentences, with no question.'}
- If their message is unclear or empty, kindly ask them to say it again in other words.

Conversation so far:
${history}

Reply with ONLY your next line — no name label, no quotes.`;
  const text = await askText(prompt);
  return text.replace(/^\s*(YOU|GRANNY|ASSISTANT)\s*:\s*/i, '').replace(/^["“]|["”]$/g, '').trim();
}

/** Turns a finished conversation into a normal checked attempt (same notebook result page). */
export function talkTopic(scenario: Scenario, level: Level): Topic {
  return { title: scenario.title, prompt: `A spoken conversation: ${scenario.desc}`, hints: [], seconds: 60, level };
}

export function learnerText(turns: Turn[]): string {
  return turns
    .filter((t) => t.who === 'me')
    .map((t) => {
      const s = t.text.trim();
      return /[.!?]$/.test(s) ? s : s + '.';
    })
    .join(' ');
}
