#!/usr/bin/env node
/* Builds the Plus Lifetime freebies as A4 PDFs in public/downloads/:
 *   - Granny's Everyday English Grammar Guide
 *   - 30-Day Speaking Planner
 * All content is original (written for Spoken English Granny). Edit the text below and run:
 *   npm run freebies        (needs Google Chrome) */
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public/downloads');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const icon = `data:image/svg+xml;base64,${readFileSync(join(ROOT, 'public/icon.svg')).toString('base64')}`;

const BASE_CSS = `
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body { font-family: Nunito, system-ui, sans-serif; color: #3b2f2a; font-size: 11pt; line-height: 1.5; margin: 0; }
h1, h2, h3 { line-height: 1.15; margin: 0; }
h2 { font-size: 17pt; color: #b8322a; margin: 0 0 8pt; padding-bottom: 4pt; border-bottom: 2px solid #fbe7e4; }
h3 { font-size: 12pt; margin: 12pt 0 4pt; }
p { margin: 0 0 7pt; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
.cover { height: 257mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
  background: #fbf6ec; border-radius: 18px; padding: 24mm; }
.cover img { width: 34mm; height: 34mm; border-radius: 9mm; margin-bottom: 10mm; }
.cover h1 { font-size: 30pt; font-weight: 900; }
.cover .pen { font-family: Caveat, cursive; color: #b8322a; font-size: 30pt; margin-top: 4mm; }
.cover .sub { margin-top: 8mm; font-size: 12pt; color: #7d6f66; max-width: 120mm; }
.cover .foot { margin-top: 18mm; font-size: 9.5pt; color: #7d6f66; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; font-size: 10pt; }
th, td { border: 1px solid #eadfcd; padding: 5pt 7pt; text-align: left; vertical-align: top; }
th { background: #fbf6ec; font-weight: 800; }
.wrong { color: #c8342b; text-decoration: line-through; }
.right { color: #3f7d4e; font-weight: 800; }
.tip { background: #eef6ef; border-radius: 10px; padding: 8pt 10pt; margin: 8pt 0; }
.note { background: #fbf6ec; border-left: 4px solid #b8322a; padding: 7pt 10pt; margin: 8pt 0; border-radius: 0 8px 8px 0; }
.two { columns: 2; column-gap: 10mm; }
.footer { position: fixed; bottom: -10mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #a2958b; }
`;

const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">';
const footer = (title) => `<div class="footer">${title} · Spoken English Granny · For Plus Lifetime members</div>`;

/* ------------------------------------------------------------------ grammar guide */
const MISTAKES = [
  ['I am having a car.', 'I have a car.', "For things you own, just say 'have'. 'Am having' is only for things happening now, like 'I am having lunch'."],
  ['Myself Priya.', 'I am Priya. / My name is Priya.', "'Myself' can't start a sentence on its own."],
  ['I am knowing him since 2 years.', 'I have known him for 2 years.', "'Know' doesn't take '-ing'. Use 'for' with an amount of time, 'since' with a starting point (since 2022)."],
  ['He don\'t like tea.', "He doesn't like tea.", "He / she / it → does / doesn't."],
  ['One of my friend is a doctor.', 'One of my friends is a doctor.', "'One of' is always followed by many (friends)."],
  ['We discussed about the plan.', 'We discussed the plan.', "'Discuss' already means 'talk about'. No 'about'."],
  ['Please revert back.', 'Please reply. / Please get back to me.', "'Revert' means go back to an old state. 'Back' is extra anyway."],
  ['I did not went there.', 'I did not go there.', "After 'did / did not', always use the base word: go, eat, see."],
  ['She is my cousin sister.', 'She is my cousin.', "In English, 'cousin' is for both boys and girls."],
  ['What is your good name?', 'What is your name? / May I know your name?', "'Good name' is a word-for-word translation of 'shubh naam'."],
  ['I have done my graduation in 2020.', 'I graduated in 2020.', "With a finished time (in 2020, yesterday), use the simple past."],
  ['Can you tell me where is the station?', 'Can you tell me where the station is?', "Inside a bigger question, keep normal order: where the station is."],
  ['He is more taller than me.', 'He is taller than me.', "'Taller' already means 'more tall'."],
  ['I will call you after reaching home.', 'I will call you when I reach home.', "Sounds more natural in everyday English."],
  ['Do the needful.', 'Please do what is needed. / Please take care of it.', 'Common in Indian offices, but sounds old-fashioned to others.'],
  ['Return back / repeat again', 'Return / repeat', "'Return' and 'repeat' already include 'back' and 'again'."],
];

const IRREGULAR = [
  ['be', 'was / were', 'been'], ['become', 'became', 'become'], ['begin', 'began', 'begun'], ['bring', 'brought', 'brought'], ['build', 'built', 'built'],
  ['buy', 'bought', 'bought'], ['catch', 'caught', 'caught'], ['choose', 'chose', 'chosen'], ['come', 'came', 'come'], ['do', 'did', 'done'],
  ['drink', 'drank', 'drunk'], ['drive', 'drove', 'driven'], ['eat', 'ate', 'eaten'], ['fall', 'fell', 'fallen'], ['feel', 'felt', 'felt'],
  ['find', 'found', 'found'], ['forget', 'forgot', 'forgotten'], ['get', 'got', 'got'], ['give', 'gave', 'given'], ['go', 'went', 'gone'],
  ['have', 'had', 'had'], ['hear', 'heard', 'heard'], ['keep', 'kept', 'kept'], ['know', 'knew', 'known'], ['leave', 'left', 'left'],
  ['lose', 'lost', 'lost'], ['make', 'made', 'made'], ['meet', 'met', 'met'], ['pay', 'paid', 'paid'], ['read', 'read', 'read'],
  ['run', 'ran', 'run'], ['say', 'said', 'said'], ['see', 'saw', 'seen'], ['sell', 'sold', 'sold'], ['send', 'sent', 'sent'],
  ['sit', 'sat', 'sat'], ['sleep', 'slept', 'slept'], ['speak', 'spoke', 'spoken'], ['spend', 'spent', 'spent'], ['take', 'took', 'taken'],
  ['teach', 'taught', 'taught'], ['tell', 'told', 'told'], ['think', 'thought', 'thought'], ['understand', 'understood', 'understood'], ['write', 'wrote', 'written'],
];

const PHRASES = [
  ['Starting a conversation', ['Hi, how are you doing?', 'It\'s nice to meet you.', 'How was your weekend?', 'What do you do?']],
  ['When you didn\'t understand', ['Sorry, could you say that again?', 'Could you speak a little slower, please?', 'What do you mean by …?', 'Let me make sure I understood: …']],
  ['In an interview', ['Thank you for this opportunity.', 'I have two years of experience in …', 'One of my strengths is …', 'Could you tell me more about the role?']],
  ['At work', ['I\'ll get back to you by 5 pm.', 'Could we move the meeting to tomorrow?', 'I\'m working on it right now.', 'Please let me know if you need anything else.']],
  ['Buying things', ['How much does this cost?', 'Do you have this in a bigger size?', 'Can I pay by UPI?', 'Is there any discount?']],
  ['Giving your opinion', ['I think …', 'In my opinion, …', 'I agree with you.', 'I see your point, but …']],
];

function grammarGuide() {
  const t = 'Everyday English Grammar Guide';
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE_CSS}</style></head><body>
${footer(t)}
<section class="page cover">
  <img src="${icon}">
  <h1>Everyday English<br>Grammar Guide</h1>
  <div class="pen">by Granny, with love</div>
  <p class="sub">The mistakes Hindi speakers make most, and the simple way to fix them. No jargon, just what to say.</p>
  <p class="foot">A free gift for Spoken English Granny Plus Lifetime members</p>
</section>

<section class="page">
  <h2>Namaste, beta!</h2>
  <p>This little guide is not a grammar textbook. It is a list of the small things that trip up almost every Hindi speaker, explained the way a grandmother would explain them: simply, kindly and with an example.</p>
  <p><b>How to use it:</b> read one section a day. Say every <span class="right">right</span> sentence out loud three times. Then practise with Granny in the app and see if the red pen catches you!</p>
  <div class="note">Mistakes are not bad. Every mistake Granny circles is one step closer to speaking English with confidence.</div>
  <h3>What's inside</h3>
  <ol>
    <li>16 mistakes we hear every day</li>
    <li>Past, present and future made simple</li>
    <li>a, an and the</li>
    <li>in, on and at</li>
    <li>Asking questions the right way</li>
    <li>45 irregular action words (go → went → gone)</li>
    <li>Ready-to-use phrases for real life</li>
    <li>Granny's 7 speaking habits</li>
  </ol>
</section>

<section class="page">
  <h2>1. Sixteen mistakes we hear every day</h2>
  <table>
    <tr><th style="width:30%">Instead of</th><th style="width:30%">Say</th><th>Why</th></tr>
    ${MISTAKES.map(([w, r, why]) => `<tr><td class="wrong">${w}</td><td class="right">${r}</td><td>${why}</td></tr>`).join('')}
  </table>
</section>

<section class="page">
  <h2>2. Past, present and future made simple</h2>
  <p>Look for the <b>time words</b>. They tell you which form to use.</p>
  <table>
    <tr><th>When?</th><th>Time words</th><th>Pattern</th><th>Example</th></tr>
    <tr><td><b>Every day / always</b></td><td>every day, usually, always, often</td><td>I work · she work<b>s</b></td><td>She <b>goes</b> to office every day.</td></tr>
    <tr><td><b>Right now</b></td><td>now, right now, at the moment</td><td>am / is / are + -ing</td><td>I <b>am cooking</b> right now.</td></tr>
    <tr><td><b>Finished in the past</b></td><td>yesterday, last week, in 2020, ago</td><td>past form (went, ate, played)</td><td>We <b>went</b> to Jaipur last year.</td></tr>
    <tr><td><b>Past until now</b></td><td>since, for, already, just, ever</td><td>have / has + done form</td><td>I <b>have lived</b> here for five years.</td></tr>
    <tr><td><b>Future</b></td><td>tomorrow, next week, soon</td><td>will + base word / going to</td><td>I <b>will call</b> you tomorrow.</td></tr>
  </table>
  <div class="tip"><b>Granny's trick:</b> if you say <i>yesterday</i>, your action word must "wear old clothes": go → went, eat → ate, buy → bought.</div>
  <h3>Negatives and "did"</h3>
  <p>After <b>did / didn't / does / doesn't / will / can</b>, use the plain base word.</p>
  <p><span class="wrong">She didn't came.</span> → <span class="right">She didn't come.</span> &nbsp; <span class="wrong">He doesn't likes it.</span> → <span class="right">He doesn't like it.</span></p>

  <h2 style="margin-top:14pt">3. a, an and the</h2>
  <table>
    <tr><th>Use</th><th>When</th><th>Example</th></tr>
    <tr><td><b>a</b></td><td>one thing, first time you mention it, before a consonant <i>sound</i></td><td>I bought <b>a</b> phone.</td></tr>
    <tr><td><b>an</b></td><td>same, but before a vowel <i>sound</i> (a, e, i, o, u sound)</td><td><b>an</b> apple, <b>an</b> hour, <b>an</b> MBA</td></tr>
    <tr><td><b>the</b></td><td>a specific thing we both know, or only one exists</td><td><b>The</b> phone I bought is great. <b>The</b> sun.</td></tr>
    <tr><td><b>nothing</b></td><td>general ideas, most names, languages, meals</td><td>I love music. I speak Hindi. Let's have lunch.</td></tr>
  </table>
</section>

<section class="page">
  <h2>4. in, on and at</h2>
  <table>
    <tr><th></th><th>Time</th><th>Place</th></tr>
    <tr><td><b>in</b> (big)</td><td>in May, in 2025, in the morning, in summer</td><td>in India, in Delhi, in the kitchen, in a car</td></tr>
    <tr><td><b>on</b> (medium)</td><td>on Monday, on 15 August, on my birthday</td><td>on the table, on the bus, on the second floor</td></tr>
    <tr><td><b>at</b> (exact point)</td><td>at 7 pm, at night, at the weekend</td><td>at home, at the station, at the door</td></tr>
  </table>
  <div class="tip"><b>Remember:</b> <i>in</i> the car but <i>on</i> the bus / train / plane (you can stand up and walk in them!).</div>

  <h2 style="margin-top:14pt">5. Asking questions the right way</h2>
  <p>In questions, the helper word comes <b>before</b> the person.</p>
  <table>
    <tr><th>Instead of</th><th>Say</th></tr>
    <tr><td class="wrong">You are coming?</td><td class="right">Are you coming?</td></tr>
    <tr><td class="wrong">Where you went yesterday?</td><td class="right">Where did you go yesterday?</td></tr>
    <tr><td class="wrong">Why she is angry?</td><td class="right">Why is she angry?</td></tr>
    <tr><td class="wrong">What you want?</td><td class="right">What do you want?</td></tr>
  </table>
  <p>Polite questions: <b>Could you …?</b> · <b>Would you mind …ing?</b> · <b>May I …?</b></p>
  <p>Example: <span class="right">Could you send me the file, please?</span> sounds friendlier than "Send me the file."</p>
</section>

<section class="page">
  <h2>6. Forty-five irregular action words</h2>
  <p>These don't follow the "-ed" rule. Read them aloud: <i>go, went, gone</i>.</p>
  <div class="two">
    <table>
      <tr><th>Base</th><th>Past</th><th>Done</th></tr>
      ${IRREGULAR.slice(0, 23).map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
    </table>
    <table>
      <tr><th>Base</th><th>Past</th><th>Done</th></tr>
      ${IRREGULAR.slice(23).map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
    </table>
  </div>
</section>

<section class="page">
  <h2>7. Ready-to-use phrases</h2>
  <div class="two">
    ${PHRASES.map(([h, list]) => `<h3>${h}</h3><ul>${list.map((x) => `<li>${x}</li>`).join('')}</ul>`).join('')}
  </div>

  <h2 style="margin-top:14pt">8. Granny's 7 speaking habits</h2>
  <ol>
    <li><b>Speak every day</b>, even for 2 minutes. Little and often beats a lot once a week.</li>
    <li><b>Think in short sentences.</b> Short and correct is better than long and confusing.</li>
    <li><b>Say it out loud</b> when you read English: news, captions, menus.</li>
    <li><b>Keep a mistake notebook.</b> Write each red-pen correction once, by hand.</li>
    <li><b>Copy good speakers.</b> Pause a video, repeat the sentence, match the rhythm.</li>
    <li><b>Don't translate word by word</b> from Hindi. Learn whole phrases instead.</li>
    <li><b>Be kind to yourself.</b> Every mistake Granny circles is progress. Shabash!</li>
  </ol>
  <div class="note">Now open Spoken English Granny, pick today's topic, and use one new phrase from this page. 👵💛</div>
</section>
</body></html>`;
}

/* ------------------------------------------------------------------ planner */
const TOPICS = [
  'Introduce yourself', 'Your morning routine', 'Your favourite food', 'Your family', 'Your best friend', 'A festival you love', 'Your hometown',
  'Your dream job', 'A movie you liked', 'Your weekend', 'A trip you remember', 'Your favourite teacher', 'Something you want to learn', 'Your phone and you',
  'Job interview: tell me about yourself', 'Your strengths and weaknesses', 'A problem you solved', 'Your goals for 5 years', 'Shopping experience', 'At the doctor',
  'Ordering at a restaurant', 'Describe your house', 'City life or village life?', 'A person who inspires you', 'Your hobbies', 'Health and fitness',
  'Technology: good or bad?', 'A day you were very happy', 'Advice to your younger self', 'What you learned this month',
];

function planner() {
  const t = '30-Day Speaking Planner';
  const rows = TOPICS.map((topic, i) => `<tr><td style="width:8%;text-align:center"><b>${i + 1}</b></td><td style="width:34%">${topic}</td><td style="width:8%;text-align:center">☐</td><td style="width:10%"></td><td>&nbsp;</td></tr>`);
  const week = (n) => `
  <h3>Week ${n} check-in</h3>
  <table>
    <tr><th style="width:40%">Question</th><th>My answer</th></tr>
    <tr><td>Days I practised this week</td><td style="height:22pt"></td></tr>
    <tr><td>My best marks this week</td><td style="height:22pt"></td></tr>
    <tr><td>The mistake I made most</td><td style="height:30pt"></td></tr>
    <tr><td>How I will fix it next week</td><td style="height:30pt"></td></tr>
    <tr><td>New words / phrases I used</td><td style="height:30pt"></td></tr>
  </table>`;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE_CSS}</style></head><body>
${footer(t)}
<section class="page cover">
  <img src="${icon}">
  <h1>30-Day<br>Speaking Planner</h1>
  <div class="pen">One topic a day. Big changes in a month.</div>
  <p class="sub">Print it or fill it on your phone. Tick each day, write your marks, and watch your confidence grow.</p>
  <p class="foot">A free gift for Spoken English Granny Plus Lifetime members</p>
</section>

<section class="page">
  <h2>My speaking goal</h2>
  <table>
    <tr><th style="width:40%">Why I want to speak better English</th><td style="height:40pt"></td></tr>
    <tr><th>Where I will use it (interview, office, college…)</th><td style="height:34pt"></td></tr>
    <tr><th>My starting marks (Day 1)</th><td style="height:22pt"></td></tr>
    <tr><th>My target marks (Day 30)</th><td style="height:22pt"></td></tr>
    <tr><th>My practice time every day</th><td style="height:22pt"></td></tr>
  </table>
  <h3>How to use this planner</h3>
  <ol>
    <li>Open Spoken English Granny every day at the same time.</li>
    <li>Speak on the day's topic below (or Granny's topic of the day).</li>
    <li>Tick the box, write your marks, and one mistake you want to remember.</li>
    <li>Every Sunday, fill in your weekly check-in.</li>
  </ol>
  <div class="tip"><b>Granny's promise:</b> 30 days of small practice will make you speak more easily, and you will make fewer of the same mistakes.</div>
</section>

<section class="page">
  <h2>Days 1–15</h2>
  <table><tr><th>Day</th><th>Topic</th><th>Done</th><th>Marks</th><th>One mistake to remember</th></tr>${rows.slice(0, 15).join('')}</table>
</section>

<section class="page">
  <h2>Days 16–30</h2>
  <table><tr><th>Day</th><th>Topic</th><th>Done</th><th>Marks</th><th>One mistake to remember</th></tr>${rows.slice(15).join('')}</table>
</section>

<section class="page">
  <h2>Weekly check-ins</h2>
  ${week(1)}${week(2)}
</section>

<section class="page">
  <h2>Weekly check-ins</h2>
  ${week(3)}${week(4)}
</section>

<section class="page">
  <h2>My mistake notebook</h2>
  <p>Write each red-pen correction once. Writing by hand helps you remember.</p>
  <table>
    <tr><th style="width:40%">I said</th><th style="width:40%">Right way</th><th>Fixed? ✓</th></tr>
    ${Array.from({ length: 18 }, () => '<tr><td style="height:21pt"></td><td></td><td></td></tr>').join('')}
  </table>
</section>

<section class="page">
  <h2>Day 30: look how far you've come!</h2>
  <table>
    <tr><th style="width:40%">My Day 1 marks</th><td style="height:24pt"></td></tr>
    <tr><th>My Day 30 marks</th><td style="height:24pt"></td></tr>
    <tr><th>What feels easier now</th><td style="height:50pt"></td></tr>
    <tr><th>My next goal</th><td style="height:50pt"></td></tr>
  </table>
  <div class="note">Shabash, beta! 🎉 Share your progress with Granny on WhatsApp. She would love to hear from you.</div>
</section>
</body></html>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const [file, html] of [
    ['granny-grammar-guide.pdf', grammarGuide()],
    ['granny-30-day-speaking-planner.pdf', planner()],
  ]) {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // PREVIEW=dir also saves a screen image of the pages, for a quick visual check.
    if (process.env.PREVIEW) {
      await page.emulateMediaType('print');
      await page.setViewport({ width: 794, height: 1123 });
      await page.screenshot({ path: join(process.env.PREVIEW, file.replace('.pdf', '.png')), fullPage: true });
    }
    await page.pdf({ path: join(OUT, file), format: 'A4', printBackground: true, displayHeaderFooter: false });
    await page.close();
    console.log(`✓ public/downloads/${file}`);
  }
} finally {
  await browser.close();
}
