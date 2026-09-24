#!/usr/bin/env node
/* Records the three product demo videos for the landing page from the REAL app.
 *
 *   1. start the dev server:   npm run dev -- --port 5188
 *   2. record:                 npm run videos            (needs Google Chrome, ffmpeg and macOS `say`)
 *
 * The app runs in demo mode (dev only): AI answers are scripted so every take is identical.
 * Output: public/videos/<name>.mp4 + <name>.jpg (poster). Edit the SCRIPTS below and re-run to
 * change wording; the voiceover is generated with the macOS voice set in VOICE. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://localhost:5188/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VOICE = process.env.VOICE || 'Tara';
const OUT = new URL('../public/videos/', import.meta.url).pathname;
const TMP = join(process.env.TMPDIR || '/tmp', 'granny-videos');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function voiceClip(text, file) {
  execFileSync('say', ['-v', VOICE, '-r', '172', '-o', file, text]);
  const d = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString();
  return parseFloat(d);
}

/* ---------- demo data for the progress video ---------- */
function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function progressSeed() {
  const now = new Date();
  const days = {};
  for (let i = 0; i < 70; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (i < 12 || (i < 60 && (i * 7) % 5 !== 0)) days[dayKey(d)] = 1 + ((i * 3) % 3);
  }
  const titles = [
    ['A festival you love', 8, 'beginner'],
    ['My dream job', 7, 'intermediate'],
    ['Job interview', 7, 'intermediate', 'interview'],
    ['A trip I remember', 6, 'intermediate'],
    ['Ordering food', 6, 'beginner', 'restaurant'],
    ['My morning routine', 5, 'beginner'],
    ['My best friend', 4, 'beginner'],
  ];
  const history = titles.map(([title, score, level, scenarioId], i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 2);
    d.setHours(19, 30);
    return {
      id: `demo-${i}`,
      createdAt: d.toISOString(),
      lang: 'english',
      mode: scenarioId ? 'talk' : 'topic',
      scenarioId,
      topic: { title, prompt: 'Tell Granny about it.', hints: [], seconds: 90, level },
      transcript: 'Last Diwali I go to my grandmother village and we was lighting diyas together.',
      analysis: {
        score,
        sentenceLevel: 'moderate',
        mistakes: [
          { wrong: 'I go', right: 'I went', why: "It happened in the past, so 'go' becomes 'went'.", kind: 'tense' },
          { wrong: 'grandmother village', right: "grandmother's village", why: "The village belongs to her, so add 's.", kind: 'grammar' },
          { wrong: 'we was', right: 'we were', why: "With 'we', always say 'were'.", kind: 'grammar' },
        ],
        correctedText: "Last Diwali I went to my grandmother's village and we were lighting diyas together.",
        remark: 'Beta, a lovely memory! Just a few small words about the past to fix.',
        strengths: ['Clear story'],
        tip: 'Change action words for the past: go → went.',
      },
    };
  });
  const earned = {};
  ['first-words', 'streak-3', 'streak-7', 'good', 'very-good', 'chatterbox', 'explorer', 'early-bird'].forEach((b, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 20 + i * 2);
    earned[b] = d.toISOString();
  });
  return {
    'granny.days.v1': days,
    'granny.history.v1': history,
    'granny.stats.v1': { sessions: 46, talks: 9, words: 3120, best: 8, mostWords: 164, levels: ['beginner', 'intermediate'], interviewBest: 7, earlyBird: true, nightOwl: false },
    'granny.badges.v1': earned,
  };
}

/* ---------- page helpers ---------- */
function overlayScript() {
  // Runs in every page before the app: captions + tap ripples.
  const style = document.createElement('style');
  style.textContent = `
    #__cap{position:fixed;left:12px;right:12px;top:10px;z-index:2147483647;background:rgba(20,42,102,.94);color:#fff;
      font:600 15px/1.35 Inter,system-ui,sans-serif;padding:11px 14px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.18);
      transition:opacity .25s ease, transform .25s ease;opacity:0;transform:translateY(-6px);text-align:center}
    #__cap.on{opacity:1;transform:none}
    .__rip{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(29,58,138,.35);
      z-index:2147483646;pointer-events:none;animation:__r .6s ease-out forwards}
    @keyframes __r{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
    ::-webkit-scrollbar{display:none}`;
  const add = () => {
    document.head.appendChild(style);
    const cap = document.createElement('div');
    cap.id = '__cap';
    document.body.appendChild(cap);
    window.__caption = (t) => {
      cap.classList.remove('on');
      setTimeout(() => {
        cap.textContent = t;
        cap.classList.toggle('on', Boolean(t));
      }, t ? 120 : 0);
    };
    document.addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.className = '__rip';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 700);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
}

async function scrollToEl(page, selector, offset = 110) {
  await page.evaluate(
    (sel, off) => {
      const el = document.querySelector(sel);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'smooth' });
    },
    selector,
    offset,
  );
  await sleep(900);
}

async function clickText(page, text) {
  await page.locator(`::-p-text(${text})`).click();
}

/* ---------- the three scripts ---------- */
const SCRIPTS = [
  {
    name: 'granny-speak-and-correct',
    posterStep: 7,
    seed: () => ({ 'granny.settings.v1': { level: 'beginner', lang: 'english' } }),
    start: '#/practice',
    steps: [
      ['Meet Spoken English Granny: the kind way to practise speaking English.'],
      ['Choose your level, and how Granny should explain your mistakes.', async (p) => {
        await clickText(p, 'Intermediate');
        await sleep(500);
        await clickText(p, 'Beginner');
      }],
      ['Tap to get a fresh topic. It is different every time.', async (p) => clickText(p, 'Give me a topic')],
      ['Read the topic and hints, then tap the mic and speak. You can also type.', async (p) => {
        await sleep(1600);
        await clickText(p, 'Type your answer instead');
      }],
      ['Say it the way you normally would. Mistakes are welcome here.', async (p) => {
        await p.type('textarea', 'Last Diwali I go to my grandmother village. We was lighting diyas and I eat too much sweets. It was the most happiest day of my year.', { delay: 28 });
      }],
      ['Now, Granny checks your English.', async (p) => {
        await clickText(p, 'Check my English');
        await sleep(2600);
      }],
      ['You get marks out of ten, with a kind remark from Granny.'],
      ["Every mistake is circled in red, with the right words written above, just like a teacher's notebook.", async (p) => scrollToEl(p, '.notebook', 60)],
      ['Tap any mistake to see why it is wrong, in simple words.', async (p) => {
        await sleep(1200);
        const marks = await p.$$('.mk');
        if (marks[2]) await marks[2].click();
        await sleep(600);
      }],
      ['Then hear the right way to say it. Start practising free today!', async (p) => scrollToEl(p, '.corrected', 160)],
    ],
  },
  {
    name: 'granny-real-conversations',
    posterStep: 7,
    seed: () => ({
      'granny.settings.v1': { level: 'intermediate', lang: 'english' },
      'granny.plus.v1': { plan: 'lifetime', until: '2999-12-31T00:00:00.000Z' },
    }),
    start: '#/talk',
    steps: [
      ['Practise real conversations: ordering food, shopping, and even job interviews.'],
      ["Let's try a job interview.", async (p) => clickText(p, 'Job interview')],
      ['Granny plays the interviewer. Just answer the way you would in real life.'],
      ['Speak, or type your answer.', async (p) => {
        await p.type('.type-row input', 'I am having two years experience in sales.', { delay: 30 });
        await p.keyboard.press('Enter');
        await sleep(1800);
      }],
      ['She keeps the conversation going, and never interrupts you for mistakes.', async (p) => {
        await p.type('.type-row input', 'I like talking to customers and solving their problems.', { delay: 30 });
        await p.keyboard.press('Enter');
        await sleep(1800);
      }],
      ['Granny quietly notes every mistake while you talk.', async (p) => {
        await p.type('.type-row input', 'Once a customer was angry about a late delivery, so I listened calmly, discuss about the problem and gave him a discount.', { delay: 22 });
        await p.keyboard.press('Enter');
        await sleep(1800);
      }],
      ['When you finish, you get marks and red-pen notes for the whole conversation.', async (p) => {
        await clickText(p, 'Finish now and see notes');
        await sleep(2600);
      }],
      ["Even habits like 'I am having' get fixed, so you sound confident in the real interview.", async (p) => scrollToEl(p, '.notebook', 60)],
      ['Practise any conversation, any time, with Spoken English Granny.', async (p) => scrollToEl(p, '.notes', 100)],
    ],
  },
  {
    name: 'granny-track-progress',
    posterStep: 1,
    seed: progressSeed,
    start: '#/practice',
    steps: [
      ['Spoken English Granny helps you build a daily speaking habit.'],
      ['Every day you practise lights up your attendance calendar, and your streak grows.', async (p) => scrollToEl(p, '.streak', 90)],
      ['Earn badges for streaks, good scores, conversations and more.', async (p) => {
        await p.evaluate(() => (location.hash = '#/badges'));
        await sleep(1200);
        await scrollToEl(p, '.badge-grid', 120);
      }],
      ['Every notebook page is saved, so you can see how far you have come.', async (p) => {
        await p.evaluate(() => (location.hash = '#/history'));
        await sleep(1000);
      }],
      ['Open any old page to revise your mistakes.', async (p) => {
        await p.locator('.history li button').click();
        await sleep(1800);
        await scrollToEl(p, '.notebook', 60);
      }],
      ['Proud of your score? Share it with friends in one tap.', async (p) => {
        await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        await sleep(900);
        await p.hover('.share-score');
      }],
      ['Your progress is saved to your account, on every device. Start free today!'],
    ],
  },
];

/* ---------- recording ---------- */
async function record(browser, script) {
  const dir = join(TMP, script.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: false });
  const seed = { 'granny.visited.v1': true, ...script.seed() };
  await page.evaluateOnNewDocument((s) => {
    window.__GRANNY_DEMO__ = true;
    // No sound from the app itself; the voiceover is added afterwards.
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    localStorage.clear();
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  }, seed);
  await page.evaluateOnNewDocument(overlayScript);
  await page.goto(BASE + script.start, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(800);

  const webm = join(dir, 'screen.webm');
  const recorder = await page.screencast({ path: webm });
  const t0 = Date.now();
  const clips = [];

  for (const [i, [text, action]] of script.steps.entries()) {
    const file = join(dir, `v${i}.aiff`);
    const dur = voiceClip(text, file);
    clips.push({ file, at: (Date.now() - t0) / 1000 + 0.15 });
    await page.evaluate((t) => window.__caption(t), text);
    const started = Date.now();
    if (action) await action(page);
    const spent = (Date.now() - started) / 1000;
    await sleep(Math.max(0, dur + 0.35 - spent) * 1000 + 250);
  }
  await page.evaluate(() => window.__caption(''));
  await sleep(1200);
  await recorder.stop();
  await page.close();

  // Mix the voice clips at their start times and join them with the screen recording.
  const out = join(OUT, `${script.name}.mp4`);
  const inputs = clips.flatMap((c) => ['-i', c.file]);
  const delays = clips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.at * 1000)}:all=1[a${i}]`).join(';');
  const mix = `${delays};${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0[voice]`;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', webm, ...inputs,
    '-filter_complex', `[0:v]fps=30,scale=720:-2:flags=lanczos,format=yuv420p[v];${mix}`,
    '-map', '[v]', '-map', '[voice]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-c:a', 'aac', '-b:a', '96k',
    '-movflags', '+faststart', out,
  ]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String((clips[script.posterStep]?.at ?? 0) + 2.2), '-i', out, '-frames:v', '1', '-q:v', '4', join(OUT, `${script.name}.jpg`)]);
  const size = (execFileSync('stat', ['-f', '%z', out]).toString().trim() / 1e6).toFixed(1);
  console.log(`✓ ${script.name}.mp4 (${size} MB)`);
}

mkdirSync(OUT, { recursive: true });
const only = process.argv[2];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
try {
  for (const s of SCRIPTS) if (!only || s.name.includes(only)) await record(browser, s);
} finally {
  await browser.close();
}
