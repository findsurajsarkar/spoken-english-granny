#!/usr/bin/env node
/* Builds the three explainer videos (motion graphics + real app screens + voiceover).
 *
 *   1. npm run dev -- --port 5188        (the app, for screenshots in demo mode)
 *   2. npm run videos                    (or: npm run videos -- conversations)
 *
 * How it stays in sync: every scene's length comes from its measured voiceover, frames are
 * rendered one by one at an exact time (no screen recording), and each voice clip is placed
 * at its scene's exact start. Needs Google Chrome, ffmpeg and the macOS `say` command.
 * Edit the VIDEOS list below to change wording or scenes, then re-run. */
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const APP = process.env.BASE_URL || 'http://localhost:5188/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VOICE = process.env.VOICE || 'Tara';
const FPS = 30;
const OUT = join(ROOT, 'public/videos');
const SHOTS = join(ROOT, 'video/shots');
const TMP = join(process.env.TMPDIR || '/tmp', 'granny-mg');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ scripts */
const URL_TEXT = 'findsurajsarkar.github.io/spoken-english-granny';
const OUTRO = (title, voice) => ({ type: 'outro', voice, data: { title, sub: 'Free plan: 3 practices every day', cta: 'Start practising free', url: URL_TEXT }, last: true });

const VIDEOS = [
  {
    name: 'granny-speak-and-correct',
    poster: 4,
    scenes: [
      { type: 'title', voice: 'Scared to speak English? Practise with Granny. She never laughs at your mistakes.', data: { emoji: '😟', kicker: 'Spoken English Granny', title: 'Scared to speak English?', sub: 'Practise with a kind granny who never laughs at your mistakes.' } },
      { type: 'steps', voice: 'It works in four simple steps.', min: 5, data: { title: 'Four simple steps', items: [['Choose your level', '🎯'], ['Get a fresh topic', '💡'], ['Speak or type', '🎤'], ['See red-pen corrections', '✍️']] } },
      { type: 'phone', voice: 'First, choose your level, and the language Granny should explain in: English, Hinglish or Hindi.', data: { shot: 'home', kicker: 'Step 1', title: 'Choose your level', callouts: [{ target: 'levels', text: 'Beginner to advanced', at: 1.0 }, { target: 'lang', text: 'English, Hinglish or Hindi', at: 3.4, side: 'left' }] } },
      { type: 'phone', voice: 'Granny gives you a new topic every time, with hints. Tap the mic and speak, or type your answer.', data: { shot: 'topic', kicker: 'Steps 2 and 3', title: 'Get a topic, then speak', callouts: [{ target: 'title', text: 'A new topic every time', at: 0.9 }, { target: 'mic', text: 'Tap and speak', at: 3.6, side: 'left' }] } },
      { type: 'redpen', voice: 'Then Granny checks your English with a red pen, just like a teacher. Every mistake is circled, and the right words are written above.', min: 6, data: { kicker: 'Step 4', title: 'Checked with a red pen', sentence: 'Yesterday I go to the market and buyed sweets.', marks: [{ wrong: 'I go', right: 'I went' }, { wrong: 'buyed', right: 'bought' }], score: 7 } },
      { type: 'phone', voice: 'You get marks out of ten, and a kind remark. Harder sentences earn more marks.', data: { shot: 'result', kicker: 'Your result', title: 'Marks and a kind remark', callouts: [{ target: 'marks', text: 'Marks out of 10', at: 0.9 }, { target: 'remark', text: 'Encouraging, never harsh', at: 2.8, side: 'left' }] } },
      { type: 'explain', voice: 'Every mistake is explained in simple words, with no grammar jargon, in the language you choose.', min: 6, data: { kicker: 'Why was it wrong?', title: 'Explained simply', wrong: 'buyed', right: 'bought', lines: [['English', "'Buy' becomes 'bought' for the past. Never 'buyed'."], ['Hinglish', "Past ke liye 'buy' ka 'bought' hota hai, 'buyed' nahi."], ['हिंदी', "बीते समय के लिए 'buy' का 'bought' होता है, 'buyed' नहीं।"]] } },
      { type: 'phone', voice: 'Tap any circled mistake to read why, and listen to the right way to say it.', data: { shot: 'notebook', kicker: 'Learn from it', title: 'Tap a mistake to learn', callouts: [{ target: 'mk', text: 'Tap a red circle', at: 0.9 }, { target: 'notes', text: 'See why in simple words', at: 2.6, side: 'left' }] } },
      OUTRO('Start speaking today', 'Start practising free today, with Spoken English Granny.'),
    ],
  },
  {
    name: 'granny-real-conversations',
    poster: 2,
    scenes: [
      { type: 'title', voice: 'Nervous before an interview, or a meeting? Practise the conversation with Granny first.', data: { emoji: '💬', kicker: 'Real conversations', title: 'Practise before the real moment', sub: 'Interviews, office chats, shopping and more.' } },
      { type: 'grid', voice: 'Choose from eight real-life situations: from ordering food and shopping, to office small talk, the doctor, the airport, and job interviews.', data: { kicker: '8 situations', title: 'Pick a situation', items: [['👵', 'Chat with Granny'], ['🍽️', 'Ordering food'], ['🛍️', 'Shopping'], ['💼', 'Job interview'], ['☕', 'Office small talk'], ['🩺', 'At the doctor'], ['✈️', 'At the airport'], ['📞', 'Customer care']] } },
      { type: 'chat', voice: 'Granny plays the other person, and replies out loud. You simply answer, the way you would in real life.', min: 6.5, data: { kicker: 'Job interview', title: 'Granny plays the interviewer', name: 'Interviewer', bubbles: [['g', 'Good morning! Please tell me a little about yourself.'], ['m', 'I am having two years experience in sales.'], ['g', "That's great! What do you enjoy most about sales?"], ['m', 'I like talking to customers and solving their problems.']] } },
      { type: 'title', voice: 'She never stops you for mistakes. She quietly notes them down while you talk.', data: { emoji: '🤫', kicker: 'No pressure', title: 'No interruptions', sub: 'Granny quietly notes your mistakes while you talk.' } },
      { type: 'phone', voice: 'Speak, or type your answer. Granny keeps the conversation going.', data: { shot: 'chat', kicker: 'In the app', title: 'A real conversation', callouts: [{ target: 'bubble', text: 'Replies read aloud', at: 0.9 }, { target: 'controls', text: 'Speak or type', at: 2.4, side: 'left' }] } },
      { type: 'redpen', voice: 'When you finish, Granny shows every mistake from the whole conversation, with marks.', min: 5.8, data: { kicker: 'After the conversation', title: 'Then, the red pen', sentence: 'I am having<br>two years experience in sales.', lineHeight: 128, marks: [{ wrong: 'I am having', right: 'I have' }, { wrong: 'two years experience', right: 'two years of experience' }], score: 7 } },
      { type: 'explain', voice: "So small habits, like saying 'I am having', get fixed before your real interview.", min: 5.5, data: { kicker: 'Fix the habit', title: 'Sound confident', wrong: 'I am having', right: 'I have', lines: [['English', "For experience you own, say 'I have'. 'I am having' is for right now, like lunch!"], ['Hinglish', "Experience ke liye 'I have' bolo. 'I am having' abhi ho rahi cheez ke liye hai."]] } },
      OUTRO('Rehearse. Then shine.', 'Rehearse any conversation, any time, with Spoken English Granny.'),
    ],
  },
  {
    name: 'granny-track-progress',
    poster: 1,
    scenes: [
      { type: 'title', voice: 'Speaking well is a habit. Granny helps you build it, a few minutes a day.', data: { emoji: '🔥', kicker: 'Daily practice', title: 'Build a speaking habit', sub: 'A few minutes a day is all it takes.' } },
      { type: 'streak', voice: 'Every day you practise lights up your attendance calendar, and your streak keeps growing.', min: 5.5, data: { kicker: 'Attendance', title: 'Your streak calendar' } },
      { type: 'grid', voice: 'Earn badges for streaks, good scores, conversations and more.', data: { kicker: '17 badges', title: 'Earn badges', items: [['🌱', 'First Words'], ['🔥', 'Warming Up'], ['🌟', 'One Full Week'], ['👍', 'Getting There'], ['💫', 'Very Good!'], ['💬', 'Chatterbox'], ['💼', 'Interview Ready'], ['👑', "Granny's Pride"]] } },
      { type: 'phone', voice: 'See your whole journey: practices, words spoken, your best score and your streaks.', data: { shot: 'badges', kicker: 'In the app', title: 'Your journey so far', callouts: [{ target: 'stats', text: 'Your stats', at: 0.9 }, { target: 'grid', text: 'Badges to unlock', at: 2.6, side: 'left' }] } },
      { type: 'scores', voice: 'Practise a little every day, and watch your marks grow, week by week.', min: 5.5, data: { kicker: 'Example progress', title: 'Watch your marks grow', items: [['Week 1', 4], ['Week 2', 5], ['Week 3', 6], ['Week 4', 7], ['Week 5', 8]] } },
      { type: 'phone', voice: 'Every notebook page is saved, so you can revise your old mistakes any time.', data: { shot: 'history', kicker: 'History', title: 'Every page saved', callouts: [{ target: 'list', text: 'Open any old page', at: 1.0 }] } },
      { type: 'devices', voice: 'Your progress is saved to your account, on your phone and on your computer.', data: { kicker: 'Everywhere', title: 'On every device' } },
      { type: 'share', voice: 'Proud of your score? Share it with your friends, in one tap.', data: { kicker: 'Share', title: 'Show your progress' } },
      OUTRO('Start your streak today', "Start your streak today, with Spoken English Granny. It's free."),
    ],
  },
];

/* ------------------------------------------------------ app screenshots */
const SHOT_SPECS = {
  home: { rects: { levels: '.choice-grid', lang: '.segmented', start: '.btn.big' } },
  topic: { rects: { title: '.topic-title', hints: '.hints', mic: '.mic' } },
  result: { rects: { marks: '.marks', remark: '.remark' } },
  notebook: { rects: { notebook: '.notebook', mk: '.mk', notes: '.notes' } },
  chat: { rects: { head: '.talk-head', bubble: '.bubble.granny', controls: '.talk-controls' } },
  history: { rects: { list: '.history ul' } },
  badges: { rects: { stats: '.stat-tiles', grid: '.badge-grid' } },
};

function progressSeed() {
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const now = new Date();
  const days = {};
  for (let i = 0; i < 60; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (i < 15 || i % 4 !== 0) days[key(d)] = 1 + (i % 3);
  }
  const history = ['A festival you love', 'My dream job', 'A trip I remember', 'My morning routine', 'My best friend'].map((title, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 3);
    return {
      id: `h${i}`, createdAt: d.toISOString(), lang: 'english', mode: 'topic',
      topic: { title, prompt: '', hints: [], seconds: 90, level: 'beginner' },
      transcript: 'I go to market.',
      analysis: { score: 8 - i, sentenceLevel: 'moderate', mistakes: [{ wrong: 'I go', right: 'I went', why: '', kind: 'tense' }], correctedText: '', remark: '', strengths: [], tip: '' },
    };
  });
  const earned = {};
  ['first-words', 'streak-3', 'streak-7', 'good', 'very-good', 'chatterbox', 'explorer'].forEach((b) => (earned[b] = now.toISOString()));
  return {
    'granny.days.v1': days,
    'granny.history.v1': history,
    'granny.stats.v1': { sessions: 46, talks: 9, words: 3120, best: 8, mostWords: 164, levels: ['beginner', 'intermediate'], interviewBest: 7, earlyBird: true, nightOwl: false },
    'granny.badges.v1': earned,
  };
}

async function appPage(browser, seed) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: false });
  await page.evaluateOnNewDocument((s) => {
    window.__GRANNY_DEMO__ = true;
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    localStorage.clear();
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
    const st = document.createElement('style');
    st.textContent = '*{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}::-webkit-scrollbar{display:none}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(st));
  }, { 'granny.visited.v1': true, 'granny.settings.v1': { level: 'beginner', lang: 'english' }, ...seed });
  return page;
}

async function snap(page, name, scrollSel, offset = 70) {
  if (scrollSel) {
    await page.evaluate((sel, off) => {
      const el = document.querySelector(sel);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - off);
    }, scrollSel, offset);
  } else await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  const rects = await page.evaluate((spec) => {
    const out = {};
    for (const [k, sel] of Object.entries(spec)) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
      out[k] = { x: r.left / innerWidth, y: top / innerHeight, w: r.width / innerWidth, h: Math.max(0, bottom - top) / innerHeight };
    }
    return out;
  }, SHOT_SPECS[name].rects);
  await page.screenshot({ path: join(SHOTS, `${name}.png`) });
  return { src: `shots/${name}.png`, w: 780, h: 1688, rects };
}

async function captureShots(browser) {
  rmSync(SHOTS, { recursive: true, force: true });
  mkdirSync(SHOTS, { recursive: true });
  const shots = {};
  const click = (p, text) => p.locator(`::-p-text(${text})`).click();

  let p = await appPage(browser, {});
  await p.goto(APP + '#/practice', { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  shots.home = await snap(p, 'home');
  await click(p, 'Give me a topic');
  await p.waitForSelector('.topic-title');
  shots.topic = await snap(p, 'topic');
  await click(p, 'Type your answer instead');
  await p.type('textarea', 'Last Diwali I go to my grandmother village. We was lighting diyas and I eat too much sweets. It was the most happiest day of my year.');
  await click(p, 'Check my English');
  await p.waitForSelector('.marks', { timeout: 15000 });
  await sleep(600);
  shots.result = await snap(p, 'result', '.report');
  shots.notebook = await snap(p, 'notebook', '.notebook');
  await p.close();

  p = await appPage(browser, { 'granny.plus.v1': { plan: 'lifetime', until: '2999-12-31T00:00:00.000Z' }, 'granny.settings.v1': { level: 'intermediate', lang: 'english' } });
  await p.goto(APP + '#/talk', { waitUntil: 'networkidle0' });
  await click(p, 'Job interview');
  await p.waitForSelector('.type-row input');
  await p.type('.type-row input', 'I am having two years experience in sales.');
  await p.keyboard.press('Enter');
  await sleep(1800);
  shots.chat = await snap(p, 'chat');
  await p.close();

  p = await appPage(browser, progressSeed());
  await p.goto(APP + '#/badges', { waitUntil: 'networkidle0' });
  await sleep(500);
  shots.badges = await snap(p, 'badges');
  await p.evaluate(() => (location.hash = '#/history'));
  await sleep(800);
  shots.history = await snap(p, 'history');
  await p.close();
  console.log(`✓ ${Object.keys(shots).length} app screenshots`);
  return shots;
}

/* ------------------------------------------------------------- render */
function voice(text, file) {
  // Speak, then trim silence from both ends so each line starts exactly on its cue.
  const raw = file.replace(/\.\w+$/, '.raw.aiff');
  execFileSync('say', ['-v', VOICE, '-r', '185', '-o', raw, text]);
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', `${trim},areverse,${trim},areverse`, '-ar', '44100', file]);
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
}

async function make(browser, video, shots) {
  const dir = join(TMP, video.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  // 1. Voice first: every scene lasts as long as its line (plus breathing room).
  const VOICE_AT = 0.45;
  let t = 0;
  const scenes = video.scenes.map((s, i) => {
    const file = join(dir, `line${i}.wav`);
    const len = voice(s.voice, file);
    const dur = Math.max(s.min ?? 4, VOICE_AT + len + (s.last ? 1.8 : 0.9));
    const sc = { type: s.type, data: s.data, caption: s.voice, start: t, dur, voiceAt: VOICE_AT, last: Boolean(s.last), file };
    t += dur;
    return sc;
  });
  const total = t;

  // 2. Render every frame at its exact time.
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 1280, deviceScaleFactor: 1.5 });
  await page.goto('file://' + join(ROOT, 'video/composer.html'), { waitUntil: 'networkidle0' });
  await page.evaluate((tl) => window.setup(tl), { scenes: scenes.map(({ file, ...s }) => s), shots, total });

  const silent = join(dir, 'video.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-pix_fmt', 'yuv420p', '-r', String(FPS), silent]);
  const frames = Math.ceil(total * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((tt) => window.render(tt), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 90, optimizeForSpeed: true });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % (FPS * 10) === 0) process.stdout.write(`  ${video.name}: ${Math.round((f / frames) * 100)}%\r`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg failed')))));
  await page.close();

  // 3. Voice clips at exact scene times, then join with the picture.
  const inputs = scenes.flatMap((s) => ['-i', s.file]);
  const delays = scenes.map((s, i) => `[${i + 1}:a]aresample=44100,adelay=${Math.round((s.start + s.voiceAt) * 1000)}:all=1[a${i}]`).join(';');
  const mix = `${delays};${scenes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${scenes.length}:normalize=0,apad[voice]`;
  const out = join(OUT, `${video.name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, ...inputs, '-filter_complex', mix, '-map', '0:v', '-map', '[voice]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '112k', '-shortest', '-movflags', '+faststart', out]);
  const posterAt = scenes[video.poster].start + scenes[video.poster].dur * 0.75;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', posterAt.toFixed(2), '-i', out, '-frames:v', '1', '-q:v', '3', join(OUT, `${video.name}.jpg`)]);
  writeFileSync(join(dir, 'timeline.json'), JSON.stringify(scenes.map(({ caption, start, dur }) => ({ caption, start, dur })), null, 1));
  console.log(`✓ ${video.name}.mp4  ${total.toFixed(1)} s`);
}

mkdirSync(OUT, { recursive: true });
const only = process.argv[2];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files'] });
try {
  const shots = await captureShots(browser);
  for (const v of VIDEOS) if (!only || v.name.includes(only)) await make(browser, v, shots);
} finally {
  await browser.close();
}
