#!/usr/bin/env node
/* Records a short SILENT walkthrough of the real app for the landing page
 * (taps, screen changes and short captions; add a voiceover later if you like).
 *
 *   1. npm run dev -- --port 5188
 *   2. npm run walkthrough            (needs Google Chrome and ffmpeg)
 *
 * The app runs in demo mode (dev only) so the AI answers are the same every take.
 * Output: public/videos/granny-walkthrough.mp4 + .jpg (poster). */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://localhost:5188/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../public/videos/', import.meta.url).pathname;
const TMP = join(process.env.TMPDIR || '/tmp', 'granny-walkthrough');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- page helpers ---------- */
function overlayScript() {
  // Runs in every page before the app: captions + tap ripples.
  const style = document.createElement('style');
  style.textContent = `
    #__cap{position:fixed;left:12px;right:12px;top:10px;z-index:2147483647;background:rgba(184,50,42,.95);color:#fff;
      font:700 15px/1.35 Nunito,system-ui,sans-serif;padding:11px 14px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.18);
      transition:opacity .25s ease, transform .25s ease;opacity:0;transform:translateY(-6px);text-align:center}
    #__cap.on{opacity:1;transform:none}
    .__rip{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(184,50,42,.35);
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
const SCRIPT = {
  name: 'granny-walkthrough',
  start: '#/practice',
  // [caption, action, seconds to hold after the action]
  steps: [
    ['Choose your level', async (p) => {
      await sleep(600);
      await clickText(p, 'Intermediate');
      await sleep(500);
      await clickText(p, 'Beginner');
    }, 1.2],
    ['Get a fresh topic', async (p) => clickText(p, 'Give me a topic'), 2.6],
    ['Tap the mic and speak, or type', async (p) => clickText(p, 'Type your answer instead'), 1],
    ['Say it your way. Mistakes are welcome!', async (p) => {
      await p.type('textarea', 'Last Diwali I go to my grandmother village. We was lighting diyas and I eat too much sweets.', { delay: 32 });
    }, 1],
    ['Granny checks your English', async (p) => clickText(p, 'Check my English'), 3],
    ['Marks out of 10, with a kind remark', async (p) => scrollToEl(p, '.report', 70), 2.5],
    ['Every mistake circled in red', async (p) => scrollToEl(p, '.notebook', 60), 3.2],
    ['Tap a mistake to see why', async (p) => {
      const marks = await p.$$('.mk');
      if (marks[2]) await marks[2].click();
    }, 3],
    ['Hear the right way to say it', async (p) => scrollToEl(p, '.corrected', 160), 2.6],
  ],
};

/* ---------- recording ---------- */
async function record(browser, script) {
  const dir = join(TMP, script.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: false });
  await page.evaluateOnNewDocument((s) => {
    window.__GRANNY_DEMO__ = true;
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    localStorage.clear();
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  }, { 'granny.visited.v1': true, 'granny.settings.v1': { level: 'beginner', lang: 'english' } });
  await page.evaluateOnNewDocument(overlayScript);
  await page.goto(BASE + script.start, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(800);

  const webm = join(dir, 'screen.webm');
  const recorder = await page.screencast({ path: webm });
  await sleep(1200);
  for (const [text, action, hold] of script.steps) {
    await page.evaluate((t) => window.__caption(t), text);
    await sleep(500);
    if (action) await action(page);
    await sleep(hold * 1000);
  }
  await page.evaluate(() => window.__caption(''));
  await sleep(800);
  await recorder.stop();
  await page.close();

  const out = join(OUT, `${script.name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-vf', 'fps=30,scale=720:-2:flags=lanczos,format=yuv420p', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-movflags', '+faststart', out]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-6', '-i', out, '-frames:v', '1', '-q:v', '4', join(OUT, `${script.name}.jpg`)]);
  const size = (Number(execFileSync('stat', ['-f', '%z', out]).toString().trim()) / 1e6).toFixed(1);
  console.log(`✓ ${script.name}.mp4 (${size} MB)`);
}

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--mute-audio'] });
try {
  await record(browser, SCRIPT);
} finally {
  await browser.close();
}
