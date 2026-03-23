#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cleanupPath = path.join(__dirname, 'cleanup.js');

// If cleanup.js is gone, self-clean: remove this file and restore dev script
if (!fs.existsSync(cleanupPath)) {
  try {
    // Restore dev script in package.json
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.scripts?.dev?.includes('postinstall.js')) {
      pkg.scripts.dev = 'next dev';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }
    // Delete this file
    fs.unlinkSync(__filename);
  } catch (_) {
    // Silently fail — next dev will still run
  }
  process.exit(0);
}

console.log(`
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   🧹 This starter includes optional features you can    │
│      strip out to match your project needs:              │
│                                                          │
│      node scripts/cleanup.js --interactive               │
│                                                          │
│   Features: clerk, kanban, chat, notifications,          │
│             themes, sentry                               │
│                                                          │
│   Preview first:  node scripts/cleanup.js --dry-run      │
│   See all options: node scripts/cleanup.js --help        │
│                                                          │
│   Don't need this? Delete scripts/cleanup.js             │
│   and this message goes away on next dev start.          │
│                                                          │
└──────────────────────────────────────────────────────────┘
`);
