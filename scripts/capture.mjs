#!/usr/bin/env node
/**
 * Captures frames of the island for visual review.
 *
 * Starts a Vite dev server, opens ?view=stage in headless Chrome, drives the island through
 * window.__island and writes PNG frames.
 *
 * Usage:
 *   node scripts/capture.mjs --run "start('timer'); expand()" --frames 20 --interval 40 --out shots/timer
 *
 * Options:
 *   --before <js>      Code run against __island before capture starts (setup).
 *   --run <js>         Code run against __island when capture starts.
 *   --out <prefix>     Output path prefix for frames (default: captures/frame).
 *   --frames <n>       Number of frames (default: 1).
 *   --interval <ms>    Delay between frames (default: 50).
 *   --timescale <n>    settings.timeScale while capturing (default: 1).
 *   --region <w>x<h>   Clip size around the island (default: 700x440).
 *   --spec <file>      JSON file with an array of { name, before, run, frames, interval } shots.
 *   --outdir <dir>     Directory for --spec shots (default: captures).
 *   --mouse <x,y>      Move the pointer before running.
 *   --set <json>       Settings patch, e.g. '{"attachment":"floating"}'.
 *   --path <file>      Path to the Chrome or Chromium executable (or CHROME_PATH).
 *   --clip             Clip to the region instead of the full viewport.
 *   --help             Show this help.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    before: { type: 'string' },
    run: { type: 'string' },
    out: { type: 'string', default: 'captures/frame' },
    frames: { type: 'string', default: '1' },
    interval: { type: 'string', default: '50' },
    timescale: { type: 'string', default: '1' },
    region: { type: 'string', default: '700x440' },
    spec: { type: 'string' },
    outdir: { type: 'string', default: 'captures' },
    mouse: { type: 'string' },
    set: { type: 'string' },
    path: { type: 'string' },
    clip: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (args.help) {
  const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const doc = source.split('*/')[0].replace(/^#!.*\n/, '').replace(/^\s*\/?\*+ ?/gm, '');
  console.log(doc.trim());
  process.exit(0);
}

const CHROME_CANDIDATES = [
  args.path,
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

function findChrome() {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    console.error('No Chrome found. Pass --path or set CHROME_PATH.');
    process.exit(1);
  }
  return found;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const pad = (n) => String(n).padStart(3, '0');

function parseRegion(value) {
  const [width, height] = value.split('x').map(Number);
  return { width: width || 700, height: height || 440 };
}

async function island(page, code) {
  if (!code) return;
  await page.evaluate((body) => {
    const api = window.__island;
    // eslint-disable-next-line no-new-func
    return new Function('api', `with (api) { ${body} }`)(api);
  }, code);
}

async function captureShot(page, shot, viewport) {
  const frames = Number(shot.frames ?? 1);
  const interval = Number(shot.interval ?? 50);
  const region = parseRegion(shot.region ?? args.region);
  const clip = {
    x: Math.max(0, (viewport.width - region.width) / 2),
    y: 0,
    width: region.width,
    height: region.height,
  };

  await island(page, 'reset()');
  if (shot.set) await island(page, `setSettings(${shot.set})`);
  await island(page, `setSettings({ timeScale: ${Number(shot.timescale ?? args.timescale)} })`);
  await island(page, shot.before);
  await sleep(400);

  if (shot.mouse) {
    const [x, y] = shot.mouse.split(',').map(Number);
    await page.mouse.move(x, y);
  }

  mkdirSync(dirname(resolve(root, shot.out)), { recursive: true });
  await island(page, shot.run);

  for (let i = 0; i < frames; i += 1) {
    const path = resolve(root, frames > 1 ? `${shot.out}-${pad(i)}.png` : `${shot.out}.png`);
    await page.screenshot({ path, ...(shot.clip ?? args.clip ? { clip } : {}) });
    if (i < frames - 1) await sleep(interval);
  }
  console.log(`captured ${frames} frame(s) -> ${shot.out}`);
}

async function main() {
  const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://localhost:${address.port}/?view=stage`;

  const viewport = { width: 1200, height: 800, deviceScaleFactor: 2 };
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, defaultViewport: viewport });

  try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => console.error('[page]', error.message));
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => Boolean(window.__island));

    const shots = args.spec
      ? JSON.parse(readFileSync(resolve(root, args.spec), 'utf8')).map((shot) => ({
          ...shot,
          out: join(args.outdir, shot.name ?? 'shot'),
        }))
      : [
          {
            before: args.before,
            run: args.run,
            out: args.out,
            frames: args.frames,
            interval: args.interval,
            timescale: args.timescale,
            region: args.region,
            mouse: args.mouse,
            set: args.set,
            clip: args.clip,
          },
        ];

    for (const shot of shots) await captureShot(page, shot, viewport);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
