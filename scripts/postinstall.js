#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cleanupPath = path.join(__dirname, 'cleanup.js');

// If cleanup.js is gone, self-clean: remove this file and restore dev script
if (!fs.existsSync(cleanupPath)) {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.scripts?.dev?.includes('postinstall.js')) {
      pkg.scripts.dev = 'next dev';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }
    fs.unlinkSync(__filename);
  } catch (_) {}
  process.exit(0);
}

// ── ANSI colors ─────────────────────────────────────────────────────

const c = {
  r: '\x1b[0m', // reset
  d: '\x1b[2m', // dim
  b: '\x1b[1m', // bold
  cyan: '\x1b[36m',
  mag: '\x1b[35m',
  yel: '\x1b[33m',
  grn: '\x1b[32m',
  wht: '\x1b[37m',
  bgCyan: '\x1b[46m\x1b[30m'
};

// ── Box drawing (ANSI-safe padding) ─────────────────────────────────

const W = 64;
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const pad = (s, w) => s + ' '.repeat(Math.max(0, w - strip(s).length));
const row = (text = '') => `${c.d}│${c.r} ${pad(text, W - 4)} ${c.d}│${c.r}`;
const top = `${c.d}┌${'─'.repeat(W - 2)}┐${c.r}`;
const bot = `${c.d}└${'─'.repeat(W - 2)}┘${c.r}`;
const div = `${c.d}├${'─'.repeat(W - 2)}┤${c.r}`;

// ── Message ─────────────────────────────────────────────────────────

const msg = [
  '',
  top,
  row(),
  row(`${c.b}${c.mag}  ✦  Shadcn Dashboard Starter${c.r}`),
  row(`${c.d}     Feature Cleanup Available${c.r}`),
  row(),
  div,
  row(),
  row(`${c.wht}Trim optional features to fit your project:${c.r}`),
  row(),
  row(`  ${c.yel}$${c.r} ${c.b}node scripts/cleanup.js --interactive${c.r}`),
  row(),
  row(`${c.d}Available modules:${c.r}`),
  row(
    `  ${c.cyan}clerk${c.d} · ${c.cyan}kanban${c.d} · ${c.cyan}chat${c.d} · ${c.cyan}notifications${c.d} · ${c.cyan}themes${c.d} · ${c.cyan}sentry${c.r}`
  ),
  row(),
  div,
  row(),
  row(`${c.grn}--dry-run${c.r}  ${c.d}Preview changes without modifying files${c.r}`),
  row(`${c.grn}--list${c.r}     ${c.d}Show all removable features${c.r}`),
  row(`${c.grn}--help${c.r}     ${c.d}See all options${c.r}`),
  row(),
  row(`${c.d}Delete ${c.wht}scripts/cleanup.js${c.d} to remove this message.${c.r}`),
  row(),
  bot,
  ''
];

console.log(msg.join('\n'));
