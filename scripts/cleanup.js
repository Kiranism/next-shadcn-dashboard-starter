#!/usr/bin/env node

/**
 * Feature Cleanup Tool
 *
 * Strips optional features from the dashboard starter.
 * Run: node scripts/cleanup.js --help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

// ─── Feature Configuration ──────────────────────────────────────────

const FEATURES = {
  clerk: {
    name: 'Clerk (Authentication, Organizations, Billing)',
    folders: [
      'src/app/auth',
      'src/app/dashboard/workspaces',
      'src/app/dashboard/billing',
      'src/app/dashboard/profile',
      'src/app/dashboard/exclusive',
      'src/features/auth',
      'src/features/profile'
    ],
    files: [
      'docs/clerk_setup.md',
      'src/components/org-switcher.tsx',
      'src/components/user-avatar-profile.tsx'
    ],
    dependencies: ['@clerk/nextjs', '@clerk/themes'],
    envVars: [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
      'WEBHOOK_SECRET'
    ],
    cleanNextConfig: true,
    navItemsToRemove: [
      '/dashboard/workspaces',
      '/dashboard/workspaces/team',
      '/dashboard/billing',
      '/dashboard/profile',
      '/dashboard/exclusive'
    ]
  },
  kanban: {
    name: 'Kanban (Drag & Drop task board)',
    folders: ['src/app/dashboard/kanban', 'src/features/kanban'],
    files: ['src/components/ui/kanban.tsx'],
    dependencies: [
      '@dnd-kit/core',
      '@dnd-kit/modifiers',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities'
    ],
    navItemsToRemove: ['/dashboard/kanban']
  },
  chat: {
    name: 'Chat (Messaging UI)',
    folders: ['src/app/dashboard/chat', 'src/features/chat'],
    files: ['src/components/ui/file-preview.tsx'],
    dependencies: [],
    navItemsToRemove: ['/dashboard/chat']
  },
  notifications: {
    name: 'Notifications (Notification center & page)',
    folders: ['src/app/dashboard/notifications', 'src/features/notifications'],
    files: ['src/components/ui/notification-card.tsx'],
    dependencies: [],
    navItemsToRemove: ['/dashboard/notifications']
  },
  examples: {
    name: 'Examples (Forms, React Query demo, Icons)',
    folders: [
      'src/app/dashboard/forms',
      'src/app/dashboard/elements',
      'src/app/dashboard/react-query',
      'src/features/forms',
      'src/features/elements',
      'src/features/react-query-demo'
    ],
    files: [],
    dependencies: [],
    navItemsToRemove: [
      '/dashboard/forms/basic',
      '/dashboard/forms/multi-step',
      '/dashboard/forms/sheet-form',
      '/dashboard/forms/advanced',
      '/dashboard/react-query',
      '/dashboard/elements/icons'
    ]
  },
  themes: {
    name: 'Extra Themes (keep only one theme)',
    custom: true
  },
  sentry: {
    name: 'Sentry (Error tracking)',
    folders: [],
    files: ['src/instrumentation.ts', 'src/instrumentation-client.ts'],
    dependencies: ['@sentry/nextjs'],
    envVars: [
      'NEXT_PUBLIC_SENTRY_DSN',
      'NEXT_PUBLIC_SENTRY_ORG',
      'NEXT_PUBLIC_SENTRY_PROJECT',
      'SENTRY_AUTH_TOKEN',
      'NEXT_PUBLIC_SENTRY_DISABLED'
    ]
  }
};

// ─── Safety Check ───────────────────────────────────────────────────

function checkGitSafe() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (_) {
    return {
      safe: false,
      message:
        'No git repository found. Initialize with "git init" and make at least one commit so you can revert (e.g. git restore .) if you run cleanup by mistake.'
    };
  }
  try {
    execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (_) {
    return {
      safe: false,
      message:
        'No commits yet. Make an initial commit so you can revert (e.g. git restore .) if you run cleanup by mistake.'
    };
  }
  return { safe: true };
}

// ─── Cleanup Engine ─────────────────────────────────────────────────

class FeatureCleanup {
  constructor(features, options = {}) {
    this.featuresToRemove = Array.isArray(features) ? features : [features];
    this.force = options.force === true;
    this.dryRun = options.dryRun === true;
    this.keepTheme = options.keepTheme || null;
  }

  log(msg) {
    console.log(this.dryRun ? `  [dry-run] ${msg}` : `  ${msg}`);
  }

  async cleanup() {
    if (!this.force) {
      const { safe, message } = checkGitSafe();
      if (!safe) {
        console.error('\n⚠️  Safety check failed:\n');
        console.error(`   ${message}\n`);
        console.error('   Run with --force to run anyway (not recommended).\n');
        process.exit(1);
      }
    }

    console.log(
      this.dryRun
        ? '🔍 Dry run mode — showing what would be changed (no files modified)\n'
        : '🧹 Starting feature cleanup...\n'
    );

    const allNavItemsToRemove = [];

    for (const featureName of this.featuresToRemove) {
      const feature = FEATURES[featureName];
      if (!feature) {
        console.log(`⚠️  Unknown feature: ${featureName}`);
        continue;
      }

      console.log(`\n📦 Removing ${feature.name}...`);

      if (feature.custom && featureName === 'themes') {
        await this.cleanThemes();
        continue;
      }

      this.deleteFolders(feature);
      this.deleteFiles(feature);
      this.applyTemplates(featureName);
      this.cleanDependencies(feature);
      this.cleanEnvVars(feature);
      if (feature.cleanNextConfig) this.cleanNextConfig();
      if (feature.navItemsToRemove?.length) {
        allNavItemsToRemove.push(...feature.navItemsToRemove);
      }
      this.cleanDocReferences(feature);
    }

    if (allNavItemsToRemove.length > 0) {
      this.cleanNavConfig(allNavItemsToRemove);
    }

    if (this.featuresToRemove.includes('notifications')) {
      this.cleanNotificationFromHeader();
      this.cleanNotificationFromSidebar();
    }

    if (this.dryRun) {
      console.log('\n🔍 Dry run complete — no files were modified.\n');
    } else {
      console.log('\n✨ Cleanup complete!\n');
      console.log('📋 Next steps:');
      console.log('  1. Run: bun install (or npm install) to sync dependencies');
      console.log('  2. Review and test your application');
      console.log('  3. To revert: git restore . (or git checkout .)');
      console.log('  4. Delete scripts/cleanup.js and scripts/cleanup-templates/ if no longer needed\n');
    }
  }

  // ── File operations ───────────────────────────────────────────────

  deleteFolders(feature) {
    if (!feature.folders) return;
    for (const folder of feature.folders) {
      const fullPath = path.join(ROOT, folder);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        if (!this.dryRun) fs.rmSync(fullPath, { recursive: true, force: true });
        this.log(`✅ Deleted folder: ${folder}`);
      }
    }
  }

  deleteFiles(feature) {
    if (!feature.files?.length) return;
    for (const file of feature.files) {
      const fullPath = path.join(ROOT, file);
      if (fs.existsSync(fullPath)) {
        if (!this.dryRun) fs.rmSync(fullPath, { force: true });
        this.log(`✅ Deleted file: ${file}`);
      }
    }
  }

  applyTemplates(featureName) {
    const templatesRoot = path.join(__dirname, 'cleanup-templates', featureName);
    if (!fs.existsSync(templatesRoot)) return;
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          const rel = path.relative(templatesRoot, full);
          if (!this.dryRun) {
            const dest = path.join(ROOT, rel);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(full, dest);
          }
          this.log(`✅ Wrote: ${rel}`);
        }
      }
    };
    walk(templatesRoot);
  }

  cleanDependencies(feature) {
    if (!feature.dependencies?.length) return;
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let removed = 0;

    for (const dep of feature.dependencies) {
      if (pkg.dependencies?.[dep]) {
        if (!this.dryRun) delete pkg.dependencies[dep];
        removed++;
      }
      if (pkg.devDependencies?.[dep]) {
        if (!this.dryRun) delete pkg.devDependencies[dep];
        removed++;
      }
    }

    if (removed > 0) {
      if (!this.dryRun) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      }
      this.log(`✅ Removed ${removed} dependencies`);
    }
  }

  cleanEnvVars(feature) {
    if (!feature.envVars?.length) return;
    const envFiles = ['.env.local', '.env.example', '.env', 'env.example.txt'];

    for (const envFile of envFiles) {
      const envPath = path.join(ROOT, envFile);
      if (!fs.existsSync(envPath)) continue;

      let content = fs.readFileSync(envPath, 'utf8');
      let modified = false;

      for (const envVar of feature.envVars) {
        const regex = new RegExp(`(#.*\\n)?^${envVar}=.*$`, 'gm');
        if (regex.test(content)) {
          content = content.replace(regex, '');
          modified = true;
        }
      }

      if (modified) {
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        if (!this.dryRun) fs.writeFileSync(envPath, content, 'utf8');
        this.log(`✅ Cleaned ${envFile}`);
      }
    }
  }

  cleanNextConfig() {
    const configPath = path.join(ROOT, 'next.config.ts');
    if (!fs.existsSync(configPath)) return;

    let content = fs.readFileSync(configPath, 'utf8');
    const before = content;
    // Remove Clerk image hostname entries (handles both comma-first and comma-after patterns)
    content = content.replace(
      /,?\s*\{\s*protocol:\s*['"]https['"],\s*hostname:\s*['"]img\.clerk\.com['"][^}]*\},?/g,
      ''
    );
    content = content.replace(
      /,?\s*\{\s*protocol:\s*['"]https['"],\s*hostname:\s*['"]clerk\.com['"][^}]*\},?/g,
      ''
    );
    // Clean up any trailing comma before closing bracket
    content = content.replace(/,(\s*\])/g, '$1');
    if (content !== before) {
      if (!this.dryRun) fs.writeFileSync(configPath, content, 'utf8');
      this.log('✅ Cleaned next.config.ts (removed Clerk image hostnames)');
    }
  }

  cleanNavConfig(navItemsToRemove) {
    const navPath = path.join(ROOT, 'src/config/nav-config.ts');
    if (!fs.existsSync(navPath)) return;

    let content = fs.readFileSync(navPath, 'utf8');
    let modified = false;

    for (const url of navItemsToRemove) {
      // Find each object containing the url and remove it using brace-depth tracking
      // This handles nested braces (e.g. access: { requireOrg: true }) and trailing comments
      let idx;
      while ((idx = content.indexOf(`'${url}'`)) !== -1) {
        // Walk backwards to find the opening brace of this object
        let start = idx;
        let depth = 0;
        while (start > 0) {
          start--;
          if (content[start] === '}') depth++;
          if (content[start] === '{') {
            if (depth === 0) break;
            depth--;
          }
        }
        // Include leading whitespace/newline
        while (
          start > 0 &&
          (content[start - 1] === ' ' || content[start - 1] === '\t' || content[start - 1] === '\n')
        ) {
          start--;
        }

        // Walk forward from the url to find the matching closing brace
        let end = idx;
        depth = 0;
        while (end < content.length) {
          if (content[end] === '{') depth++;
          if (content[end] === '}') {
            depth--;
            if (depth < 0) {
              end++;
              break;
            }
          }
          end++;
        }
        // Skip trailing comma and whitespace
        if (content[end] === ',') end++;

        content = content.slice(0, start) + content.slice(end);
        modified = true;
      }
    }

    // Clean up empty parent groups (items array with only whitespace)
    content = content.replace(/,?\s*\{[^{}]*items:\s*\[\s*\]\s*\}/g, (match, offset) => {
      // Only remove if it looks like a parent group (has url: '#')
      return match.includes("url: '#'") ? '' : match;
    });

    // Clean up empty label groups with no items left
    content = content.replace(
      /,?\s*\{\s*label:\s*['"][^'"]*['"],\s*items:\s*\[\s*\]\s*\}/g,
      ''
    );

    content = content.replace(/,(\s*\])/g, '$1');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      if (!this.dryRun) fs.writeFileSync(navPath, content, 'utf8');
      this.log(`✅ Cleaned nav-config.ts (removed ${navItemsToRemove.length} items)`);
    }
  }

  cleanNotificationFromHeader() {
    const headerPath = path.join(ROOT, 'src/components/layout/header.tsx');
    if (!fs.existsSync(headerPath)) return;

    let content = fs.readFileSync(headerPath, 'utf8');
    const before = content;

    content = content.replace(/import\s*\{[^}]*NotificationCenter[^}]*\}[^;]*;\n?/g, '');
    content = content.replace(/\s*<NotificationCenter\s*\/>\n?/g, '');

    if (content !== before) {
      if (!this.dryRun) fs.writeFileSync(headerPath, content, 'utf8');
      this.log('✅ Cleaned header.tsx (removed NotificationCenter)');
    }
  }

  cleanNotificationFromSidebar() {
    const sidebarPath = path.join(ROOT, 'src/components/layout/app-sidebar.tsx');
    if (!fs.existsSync(sidebarPath)) return;

    let content = fs.readFileSync(sidebarPath, 'utf8');
    const before = content;

    // Remove the Notifications dropdown menu item from the sidebar footer
    content = content.replace(
      /\s*<DropdownMenuItem[^>]*onClick=\{[^}]*\/dashboard\/notifications[^}]*\}[^>]*>\s*(?:<[^>]+>\s*)?Notifications\s*<\/DropdownMenuItem>/g,
      ''
    );

    if (content !== before) {
      if (!this.dryRun) fs.writeFileSync(sidebarPath, content, 'utf8');
      this.log('✅ Cleaned app-sidebar.tsx (removed Notifications menu item)');
    }
  }

  cleanDocReferences(feature) {
    if (!feature.name.toLowerCase().includes('clerk')) return;

    const docFiles = [
      path.join(ROOT, 'README.md'),
      path.join(ROOT, 'docs/nav-rbac.md'),
      path.join(ROOT, 'src/config/infoconfig.ts')
    ];

    for (const filePath of docFiles) {
      if (!fs.existsSync(filePath)) continue;
      let content = fs.readFileSync(filePath, 'utf8');
      const before = content;
      content = content.replace(/\n*# Clerk Setup Guide[\s\S]*?(?=\n#|\n##|$)/gi, '\n');
      content = content.replace(/Clerk['\s]/gi, 'Auth ');
      content = content.replace(/clerk\.com[^\s]*/gi, '');
      if (content !== before) {
        if (!this.dryRun) {
          fs.writeFileSync(filePath, content.replace(/\n\s*\n\s*\n/g, '\n\n'), 'utf8');
        }
        this.log(`✅ Cleaned doc references: ${path.relative(ROOT, filePath)}`);
      }
    }
  }

  // ── Dynamic theme cleanup ─────────────────────────────────────────

  async cleanThemes() {
    const themesDir = path.join(ROOT, 'src/styles/themes');
    if (!fs.existsSync(themesDir)) return;

    const themeFiles = fs.readdirSync(themesDir).filter((f) => f.endsWith('.css'));
    const themes = themeFiles.map((f) => ({
      file: f,
      value: f.replace('.css', ''),
      name: f
        .replace('.css', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    }));

    if (themes.length <= 1) {
      this.log('Only one theme found, nothing to clean.');
      return;
    }

    if (this.dryRun) {
      this.log(`Found ${themes.length} themes: ${themes.map((t) => t.value).join(', ')}`);
      this.log('Would prompt user to pick one theme to keep and remove the rest.');
      return;
    }

    // Use pre-set theme (for --all) or prompt
    let keepValue = this.keepTheme;

    if (!keepValue) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      const question = (q) => new Promise((resolve) => rl.question(q, resolve));

      console.log('\n  Available themes:\n');
      themes.forEach((t, i) => {
        console.log(`    ${i + 1}. ${t.name} (${t.value})`);
      });

      const answer = await question(
        `\n  Which theme to keep? (1-${themes.length}, default: vercel) `
      );
      rl.close();

      const index = parseInt(answer, 10) - 1;
      const selected = themes[index] || themes.find((t) => t.value === 'vercel') || themes[0];
      keepValue = selected.value;
    }

    const keep = themes.find((t) => t.value === keepValue) || themes[0];
    const toRemove = themes.filter((t) => t.value !== keep.value);

    this.log(`Keeping: ${keep.name} (${keep.value})`);

    // Delete other theme CSS files
    for (const theme of toRemove) {
      const filePath = path.join(themesDir, theme.file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
        this.log(`✅ Deleted: src/styles/themes/${theme.file}`);
      }
    }

    // Rewrite theme.css
    const themeCssPath = path.join(ROOT, 'src/styles/theme.css');
    if (fs.existsSync(themeCssPath)) {
      fs.writeFileSync(
        themeCssPath,
        `/* Import individual theme files */
@import './themes/${keep.file}';

body {
  @apply overscroll-none;
}

:root {
  --header-height: calc(var(--spacing, 0.25rem) * 12 + 1px);
}

[data-theme] body {
  --font-sans: initial;
  --font-mono: initial;
  --font-serif: initial;
  font-family: var(--font-sans);
}
`,
        'utf8'
      );
      this.log('✅ Rewrote: src/styles/theme.css');
    }

    // Rewrite theme.config.ts
    const configPath = path.join(ROOT, 'src/components/themes/theme.config.ts');
    if (fs.existsSync(configPath)) {
      fs.writeFileSync(
        configPath,
        `/**
 * Default theme that loads when no user preference is set
 * Change this value to set a different default theme
 */
export const DEFAULT_THEME = '${keep.value}';

export const THEMES = [
  {
    name: '${keep.name}',
    value: '${keep.value}'
  }
];
`,
        'utf8'
      );
      this.log('✅ Rewrote: src/components/themes/theme.config.ts');
    }
  }
}

// ─── CLI ────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
🧹 Feature Cleanup Tool

Usage:
  node scripts/cleanup.js [features...]
  node scripts/cleanup.js --interactive

Examples:
  node scripts/cleanup.js clerk
  node scripts/cleanup.js kanban chat       # remove multiple at once
  node scripts/cleanup.js --interactive     # interactive mode
  node scripts/cleanup.js --dry-run kanban  # preview without changing files
  node scripts/cleanup.js --all             # remove all optional features
  node scripts/cleanup.js --list
  node scripts/cleanup.js --help

Flags:
  --interactive   Select features via interactive prompts
  --dry-run       Show what would be changed without modifying any files
  --force         Skip git safety check (not recommended)
  --all           Remove all optional features
  --list          List available features
  --help          Show this help

Safety:
  Before running, the script checks for a git repo with at least one commit
  so you can revert (git restore .) if needed. Use --force to skip this check.

Available features:
${Object.entries(FEATURES)
  .map(([key, value]) => `  - ${key.padEnd(18)} ${value.name}`)
  .join('\n')}
  `);
}

function listFeatures() {
  console.log('\n📦 Available features:\n');
  for (const [key, value] of Object.entries(FEATURES)) {
    console.log(`  ${key}`);
    console.log(`    ${value.name}`);
    if (value.folders?.length) console.log(`    Folders: ${value.folders.length}`);
    if (value.files?.length) console.log(`    Files: ${value.files.length}`);
    if (value.dependencies?.length) console.log(`    Dependencies: ${value.dependencies.length}`);
    console.log('');
  }
}

async function runInteractive(options = {}) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n🧹 Interactive Feature Cleanup\n');
  console.log('Select features to remove:\n');

  const selected = [];
  for (const [key, value] of Object.entries(FEATURES)) {
    const answer = await question(`  Remove ${value.name}? (y/N) `);
    if (answer.toLowerCase() === 'y') {
      selected.push(key);
    }
  }

  if (selected.length === 0) {
    console.log('\nNo features selected. Exiting.\n');
    rl.close();
    return;
  }

  console.log(`\n📋 Will remove: ${selected.join(', ')}`);
  const confirm = await question('\nProceed? (y/N) ');
  rl.close();

  if (confirm.toLowerCase() !== 'y') {
    console.log('\nCancelled.\n');
    return;
  }

  const cleanup = new FeatureCleanup(selected, options);
  await cleanup.cleanup();
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const filteredArgs = args.filter((a) => a !== '--force' && a !== '--dry-run');

  if (filteredArgs.length === 0 || filteredArgs.includes('--help')) {
    showHelp();
    return;
  }

  if (filteredArgs.includes('--list')) {
    listFeatures();
    return;
  }

  if (filteredArgs.includes('--interactive')) {
    await runInteractive({ force, dryRun });
    return;
  }

  if (filteredArgs.includes('--all')) {
    const allFeatures = Object.keys(FEATURES);
    const cleanup = new FeatureCleanup(allFeatures, {
      force,
      dryRun,
      keepTheme: 'vercel'
    });
    await cleanup.cleanup();
    return;
  }

  const features = filteredArgs.filter((a) => !a.startsWith('-'));
  const cleanup = new FeatureCleanup(features, { force, dryRun });
  await cleanup.cleanup();
}

main().catch(console.error);
