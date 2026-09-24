#!/usr/bin/env node
/* Makes the shareable QR codes and a share card in marketing/.
 *   npm run share-kit      (needs Google Chrome for the PNG rendering) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'marketing');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// QR codes point at the full addresses (no dependency on the link shortener);
// the short links are for typing and sharing as text.
const LINKS = {
  website: { qr: 'https://findsurajsarkar.github.io/spoken-english-granny/?ref=qr', short: 'tinyurl.com/spoken-english-granny' },
  android: { qr: 'https://tinyurl.com/granny-android', short: 'tinyurl.com/granny-android' },
};

const icon = `data:image/svg+xml;base64,${readFileSync(join(ROOT, 'public/icon.svg')).toString('base64')}`;

async function qrSvg(text, color) {
  // High error correction so the logo in the middle doesn't stop it scanning.
  return QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'H', margin: 0, color: { dark: color, light: '#ffffff' } });
}

const qrBlock = (svg, size) => `
  <div class="qr" style="width:${size}px;height:${size}px">${svg}<img src="${icon}" alt=""></div>`;

const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Nunito,system-ui,sans-serif;color:#3b2f2a}
  .qr{position:relative}
  .qr svg{width:100%;height:100%;display:block}
  .qr img{position:absolute;left:50%;top:50%;width:22%;height:22%;transform:translate(-50%,-50%);border-radius:18%;border:6px solid #fff;background:#fff}`;

const fonts = '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">';

function single(title, sub, svg, short) {
  return `<!doctype html><html><head>${fonts}<style>${css}
  body{width:1080px;height:1350px;background:#fbf6ec;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center}
  .brand{display:flex;align-items:center;gap:18px;font-weight:900;font-size:46px}
  .brand img{width:84px;height:84px;border-radius:20px}
  .card{background:#fff;border-radius:48px;padding:56px;box-shadow:0 40px 80px -40px rgba(59,47,42,.45)}
  h1{font-size:64px;font-weight:900;line-height:1.1}
  p{font-size:34px;color:#7d6f66;font-weight:700}
  .url{font-size:36px;font-weight:800;color:#b8322a}
  </style></head><body>
  <div class="brand"><img src="${icon}">Spoken English Granny</div>
  <h1>${title}</h1>
  <div class="card">${qrBlock(svg, 600)}</div>
  <p>${sub}</p>
  <div class="url">${short}</div>
  </body></html>`;
}

function card(web, apk) {
  return `<!doctype html><html><head>${fonts}<style>${css}
  body{width:1080px;height:1350px;background:#fbf6ec;padding:70px 64px;display:flex;flex-direction:column;align-items:center;text-align:center}
  .brand{display:flex;align-items:center;gap:18px;font-weight:900;font-size:44px}
  .brand img{width:80px;height:80px;border-radius:20px}
  h1{margin-top:44px;font-size:70px;font-weight:900;line-height:1.08;letter-spacing:-1px}
  h1 em{font-family:Caveat,cursive;font-style:normal;color:#b8322a;font-size:92px;display:block;margin-top:6px}
  .lead{margin-top:22px;font-size:32px;color:#7d6f66;font-weight:700;line-height:1.35}
  .row{margin-top:56px;display:flex;gap:40px}
  .box{flex:1;background:#fff;border-radius:40px;padding:36px 30px;box-shadow:0 30px 60px -36px rgba(59,47,42,.45);display:flex;flex-direction:column;align-items:center;gap:22px}
  .box b{font-size:36px;font-weight:900}
  .box span{font-size:23px;font-weight:800;color:#b8322a;white-space:nowrap}
  .foot{margin-top:auto;font-size:26px;color:#7d6f66;font-weight:700}
  </style></head><body>
  <div class="brand"><img src="${icon}">Spoken English Granny</div>
  <h1>Speak English without fear.<em>Granny never laughs!</em></h1>
  <p class="lead">Talk about anything. Granny checks your English with a red pen<br>and explains every mistake in Hindi, Hinglish or English.</p>
  <div class="row">
    <div class="box"><b>🌐 Open the app</b>${qrBlock(web, 360)}<span>${LINKS.website.short}</span></div>
    <div class="box"><b>🤖 Android app</b>${qrBlock(apk, 360)}<span>${LINKS.android.short}</span></div>
  </div>
  <p class="foot">Free · 3 practices every day · Scan with your phone camera</p>
  </body></html>`;
}

const web = await qrSvg(LINKS.website.qr, '#3b2f2a');
const apk = await qrSvg(LINKS.android.qr, '#3b2f2a');
const pages = {
  'share-card.png': [card(web, apk), 1080, 1350],
  'qr-website.png': [single('Practise spoken English', 'Scan to open Granny in your browser', web, LINKS.website.short), 1080, 1350],
  'qr-android.png': [single('Get the Android app', 'Scan to download the free app', apk, LINKS.android.short), 1080, 1350],
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const [file, [html, w, h]] of Object.entries(pages)) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: join(OUT, file) });
    await page.close();
    console.log(`✓ marketing/${file}`);
  }
} finally {
  await browser.close();
}
writeFileSync(join(OUT, 'qr-website.svg'), web);
writeFileSync(join(OUT, 'qr-android.svg'), apk);
