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

// Feature-specific doc content is removed by CONTENT ANCHORS — no marker
// comments live in the docs themselves. Rule types, applied per file:
//   lines:       drop every line containing the substring
//   sections:    drop a markdown section — the exact heading line through
//                the line before the next heading of the same/higher level
//   blocks:      drop from the line containing `start` through the line
//                containing `end` (inclusive)
//   envSections: drop an env.example-style `# ===` header trio + its body
//   jsxSections: drop the enclosing <section>…</section> around the text
// Anchors that no longer match anything print a ⚠️ warning so doc drift
// is loud instead of silent.
const DOC_RULES = {
  clerk: [
    {
      file: 'README.md',
      lines: [
        'Sponsored_by-Clerk',
        'Auth, organizations, and billing function end-to-end.',
        '- Auth - [Clerk](',
        '- Authentication and user management through Clerk',
        'using Clerk Organizations (create, switch',
        'via Clerk Billing for B2B',
        '- Client-side RBAC navigation that filters menu items',
        '| [Signup / Signin](',
        '| [Profile](',
        '| [Workspaces](',
        '| [Team Management](',
        '| [Billing & Plans](',
        '| [Exclusive Page](',
        '── workspaces',
        '── billing',
        '── profile',
        '── exclusive',
        '── auth',
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=',
        'CLERK_SECRET_KEY='
      ],
      blocks: [
        { start: '##### Clerk setup', end: 'docs/clerk_setup.md).' },
        { start: '**Can I use it without Clerk?**', end: 'wire in your own auth solution.' }
      ]
    },
    {
      file: 'AGENTS.md',
      lines: [
        '**Authentication**: Clerk',
        '**Note**: Clerk supports "keyless mode"',
        '- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`',
        '- `CLERK_SECRET_KEY`',
        '`img.clerk.com`',
        '[Clerk Next.js SDK]',
        '── workspaces',
        '── billing',
        '── profile',
        '── exclusive',
        '── auth',
        '── clerk_setup',
        '── nav-rbac',
        '# Remove auth/org/billing'
      ],
      sections: [
        '### Authentication & Authorization',
        '## Authentication Patterns',
        '### Client-Side Filtering',
        '### Required for Authentication (Clerk)'
      ],
      blocks: [
        { start: '**Clerk keyless mode popup**', end: 'claim application or set env variables' },
        { start: '**Navigation items not showing**', end: 'org/permission/role' }
      ]
    },
    { file: 'CLAUDE.md', lines: ['nav-rbac.md', 'clerk_setup.md'] },
    {
      file: 'env.example.txt',
      envSections: [
        'Authentication Configuration (Clerk)',
        'Clerk Organizations Configuration',
        'Clerk Webhooks'
      ]
    },
    { file: 'Dockerfile', lines: ['ARG NEXT_PUBLIC_CLERK'] },
    { file: 'Dockerfile.bun', lines: ['ARG NEXT_PUBLIC_CLERK'] },
    { file: 'src/app/about/page.tsx', jsxSections: ['Authentication by Clerk'] },
    { file: 'src/app/privacy-policy/page.tsx', jsxSections: ['Authentication by Clerk'] }
  ],
  sentry: [
    {
      file: 'README.md',
      lines: ['- Error tracking - [Sentry](', '| [Global Error](']
    },
    {
      file: 'AGENTS.md',
      lines: [
        '**Error Tracking**: Sentry',
        '- `global-error.tsx` - Catches all errors, reports to Sentry',
        '- `SENTRY_*` variables',
        '- Sentry source maps uploaded automatically',
        '[Sentry Next.js]',
        '# Remove error tracking'
      ],
      sections: ['### Optional for Error Tracking (Sentry)', '### Sentry Integration']
    },
    { file: 'env.example.txt', envSections: ['Error Tracking Configuration (Sentry)'] },
    { file: 'Dockerfile', lines: ['ARG NEXT_PUBLIC_SENTRY'] },
    { file: 'Dockerfile.bun', lines: ['ARG NEXT_PUBLIC_SENTRY'] }
  ],
  kanban: [
    { file: 'README.md', lines: ['| [Kanban Board](', '── kanban'] },
    { file: 'AGENTS.md', lines: ['── kanban', '# Remove kanban board'] }
  ],
  chat: [
    { file: 'README.md', lines: ['| [Chat](', '── chat'] },
    { file: 'AGENTS.md', lines: ['── chat', '# Remove messaging UI'] }
  ],
  notifications: [
    { file: 'README.md', lines: ['| [Notifications](', '── notifications'] },
    { file: 'AGENTS.md', lines: ['── notifications', '# Remove notification center'] }
  ],
  themes: [{ file: 'AGENTS.md', lines: ['# Keep one theme, remove rest'] }],
  examples: [
    { file: 'README.md', lines: ['| [React Query Demo](', '── react-query'] },
    // No '── forms' / '── elements' anchors: the only tree line matching
    // those is src/components/forms/ (the shared field components), which
    // survives examples removal.
    { file: 'AGENTS.md', lines: ['── react-query'], sections: ['### Icon Showcase Page'] },
    {
      file: 'docs/forms.md',
      // The multi-step paragraph references the removed demo + use-stepper;
      // the examples table references the removed /dashboard/forms routes.
      blocks: [{ start: '**Multi-step forms.**', end: 'multi-step-product-form.tsx' }],
      sections: ['## Examples in the dashboard']
    }
  ]
};

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
      'src/features/profile',
      '.clerk'
    ],
    files: [
      'docs/clerk_setup.md',
      'docs/nav-rbac.md',
      'src/components/org-switcher.tsx',
      'src/components/user-avatar-profile.tsx'
    ],
    dependencies: ['@clerk/nextjs'],
    envVars: [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
      'WEBHOOK_SECRET'
    ],
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
    // demo-form is the basic-forms page's component; use-stepper is only
    // consumed by the multi-step demo — both orphaned once the pages go.
    // The shared field components (src/components/forms/fields, src/lib/form)
    // stay: the product and user forms use them.
    files: ['src/components/forms/demo-form.tsx', 'src/hooks/use-stepper.tsx'],
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
        this.applyDocRules(featureName);
        await this.cleanThemes();
        continue;
      }

      this.deleteFolders(feature);
      this.deleteFiles(feature);
      this.applyTemplates(featureName);
      this.cleanDependencies(feature);
      this.cleanEnvVars(feature);
      if (feature.navItemsToRemove?.length) {
        allNavItemsToRemove.push(...feature.navItemsToRemove);
      }
      this.applyDocRules(featureName);
    }

    if (allNavItemsToRemove.length > 0) {
      this.cleanNavConfig(allNavItemsToRemove);
    }

    // Runs after the loop so it also strips the Clerk hosts from a
    // freshly-written sentry next.config.ts template (idempotent, so any
    // feature order works). Checks package.json too, so a sentry run AFTER
    // an earlier clerk removal doesn't re-add the hosts.
    const pkgPath = path.join(ROOT, 'package.json');
    const pkgNow = fs.existsSync(pkgPath)
      ? JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      : null;
    const clerkGone =
      this.featuresToRemove.includes('clerk') || !pkgNow?.dependencies?.['@clerk/nextjs'];
    if (clerkGone) {
      this.cleanNextConfig();
    }

    this.remapNotificationLinks(allNavItemsToRemove);

    this.cleanConditionalDeps();

    if (this.featuresToRemove.includes('notifications')) {
      this.cleanNotificationFromHeader();
      this.cleanNotificationFromSidebar();
    }

    if (this.featuresToRemove.includes('sentry')) {
      this.cleanLaunchJson();
    }

    if (this.dryRun) {
      console.log('\n🔍 Dry run complete — no files were modified.\n');
    } else {
      // Stale generated route types for deleted pages would fail
      // `tsc --noEmit` until the next build regenerates them.
      const nextCache = path.join(ROOT, '.next');
      if (fs.existsSync(nextCache)) {
        fs.rmSync(nextCache, { recursive: true, force: true });
        console.log('  🧹 Cleared .next cache (stale route types for removed pages)');
      }
      console.log('\n✨ Cleanup complete!\n');
      console.log('📋 Next steps:');
      console.log('  1. Run: bun install (or npm install) to sync dependencies');
      console.log('  2. Review and test your application');
      console.log('  3. To revert: git restore . (or git checkout .)');
      console.log('     Untracked files are not covered by git restore — modified env files');
      console.log('     are backed up as *.cleanup-backup; .clerk/ regenerates on next dev run');
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

  // Shared deps that only some optional features import. After removals,
  // drop any that no surviving src/ file imports anymore. In dry-run mode
  // the feature files still exist on disk, so survivors are computed as
  // "files not scheduled for deletion by the selected features".
  cleanConditionalDeps() {
    // zustand: chat/kanban/notifications stores · motion: chat + the
    // examples multi-step form · uuid: kanban store
    const CONDITIONAL_DEPS = ['zustand', 'motion', 'uuid'];

    const pkgPath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(pkgPath)) return;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const removedFolders = this.featuresToRemove
      .flatMap((name) => FEATURES[name]?.folders || [])
      .map((folder) => path.join(ROOT, folder) + path.sep);
    const removedFiles = new Set(
      this.featuresToRemove
        .flatMap((name) => FEATURES[name]?.files || [])
        .map((file) => path.join(ROOT, file))
    );

    const survivors = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          if (removedFolders.some((folder) => full.startsWith(folder))) continue;
          if (removedFiles.has(full)) continue;
          survivors.push(full);
        }
      }
    };
    const srcRoot = path.join(ROOT, 'src');
    if (fs.existsSync(srcRoot)) walk(srcRoot);

    // Doc lines to drop when the dep actually leaves package.json
    // (tech-stack bullets can't carry per-feature markers — they only go
    // stale once every consumer feature is gone).
    const DEP_DOC_TOKENS = { zustand: ['Zustand'] };

    let changed = false;
    const removedDeps = [];
    for (const dep of CONDITIONAL_DEPS) {
      if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]) continue;
      const importRe = new RegExp(`from\\s+['"]${dep}(/[^'"]*)?['"]`);
      const stillUsed = survivors.some((file) => importRe.test(fs.readFileSync(file, 'utf8')));
      if (stillUsed) continue;
      if (!this.dryRun) {
        if (pkg.dependencies?.[dep]) delete pkg.dependencies[dep];
        if (pkg.devDependencies?.[dep]) delete pkg.devDependencies[dep];
        if (pkg.devDependencies?.[`@types/${dep}`]) delete pkg.devDependencies[`@types/${dep}`];
      }
      changed = true;
      removedDeps.push(dep);
      this.log(`✅ Removed orphaned dependency: ${dep}`);
    }

    if (changed && !this.dryRun) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }

    for (const dep of removedDeps) {
      const tokens = DEP_DOC_TOKENS[dep];
      if (!tokens) continue;
      for (const docFile of ['README.md', 'AGENTS.md']) {
        const docPath = path.join(ROOT, docFile);
        if (!fs.existsSync(docPath)) continue;
        const original = fs.readFileSync(docPath, 'utf8');
        const kept = original
          .split('\n')
          .filter((line) => !tokens.some((token) => line.includes(token)))
          .join('\n');
        if (kept !== original) {
          if (!this.dryRun) fs.writeFileSync(docPath, kept, 'utf8');
          this.log(`✅ Dropped ${dep} doc lines: ${docFile}`);
        }
      }
    }
  }

  cleanEnvVars(feature) {
    if (!feature.envVars?.length) return;
    const envFiles = ['.env.local', '.env.example', '.env', 'env.example.txt'];
    // git restore can't bring back untracked files — keep a one-time backup
    // of the user's real env files before the first modification.
    const backupWorthy = new Set(['.env.local', '.env']);

    for (const envFile of envFiles) {
      const envPath = path.join(ROOT, envFile);
      if (!fs.existsSync(envPath)) continue;

      const original = fs.readFileSync(envPath, 'utf8');
      let content = original;
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
        if (!this.dryRun) {
          if (backupWorthy.has(envFile)) {
            const backupPath = envPath + '.cleanup-backup';
            if (!fs.existsSync(backupPath)) {
              fs.writeFileSync(backupPath, original, 'utf8');
              this.log(`🛟 Backed up ${envFile} → ${envFile}.cleanup-backup`);
            }
          }
          fs.writeFileSync(envPath, content, 'utf8');
        }
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

    // Normalize commas orphaned by the removals above BEFORE the label-group
    // pass — a removed first/last element leaves "[ ," or ", ]" inside the
    // group, and the empty-label regex only matches a truly empty "[ ]".
    content = content.replace(/,(\s*\])/g, '$1');
    content = content.replace(/\[(\s*),/g, '[$1');

    // Clean up empty label groups with no items left
    content = content.replace(
      /,?\s*\{\s*label:\s*['"][^'"]*['"],\s*items:\s*\[\s*\]\s*\}/g,
      ''
    );

    content = content.replace(/,(\s*\])/g, '$1');
    content = content.replace(/\[(\s*),/g, '[$1');
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

  // Drops a removed feature's doc content by content anchors (see DOC_RULES).
  // No marker comments exist in the docs — every anchor is real content, and
  // an anchor that stops matching prints a warning instead of failing silent.
  applyDocRules(featureName) {
    const rules = DOC_RULES[featureName];
    if (!rules) return;

    for (const rule of rules) {
      const filePath = path.join(ROOT, rule.file);
      if (!fs.existsSync(filePath)) continue;

      const original = fs.readFileSync(filePath, 'utf8');
      let lines = original.split('\n');
      const warn = (anchor) =>
        this.log(`⚠️  Doc anchor not found in ${rule.file}: ${anchor}`);

      for (const heading of rule.sections || []) {
        const idx = lines.findIndex((line) => line.trim() === heading);
        if (idx === -1) {
          warn(heading);
          continue;
        }
        const level = heading.match(/^#+/)[0].length;
        let end = lines.length;
        let inFence = false;
        for (let i = idx + 1; i < lines.length; i++) {
          if (/^\s*```/.test(lines[i])) {
            inFence = !inFence;
            continue;
          }
          // `# comment` lines inside code fences are not markdown headings
          if (inFence) continue;
          const m = lines[i].match(/^(#{1,6})\s/);
          if (m && m[1].length <= level) {
            end = i;
            break;
          }
        }
        lines.splice(idx, end - idx);
      }

      for (const block of rule.blocks || []) {
        const start = lines.findIndex((line) => line.includes(block.start));
        if (start === -1) {
          warn(block.start);
          continue;
        }
        let end = -1;
        for (let i = start; i < lines.length; i++) {
          if (lines[i].includes(block.end)) {
            end = i;
            break;
          }
        }
        if (end === -1) {
          warn(block.end);
          continue;
        }
        lines.splice(start, end - start + 1);
      }

      for (const title of rule.envSections || []) {
        const isBar = (line) => /^# ={10,}/.test(line || '');
        const t = lines.findIndex(
          (line, i) => line.includes(title) && isBar(lines[i - 1]) && isBar(lines[i + 1])
        );
        if (t === -1) {
          warn(title);
          continue;
        }
        let end = lines.length;
        for (let i = t + 2; i < lines.length; i++) {
          if (isBar(lines[i]) && lines[i + 1] !== undefined && !isBar(lines[i + 1])) {
            end = i;
            break;
          }
        }
        lines.splice(t - 1, end - (t - 1));
      }

      for (const text of rule.jsxSections || []) {
        const hit = lines.findIndex((line) => line.includes(text));
        if (hit === -1) {
          warn(text);
          continue;
        }
        let start = hit;
        while (start > 0 && !lines[start].includes('<section')) start--;
        let end = hit;
        while (end < lines.length - 1 && !lines[end].includes('</section>')) end++;
        lines.splice(start, end - start + 1);
      }

      for (const token of rule.lines || []) {
        const before = lines.length;
        lines = lines.filter((line) => !line.includes(token));
        if (lines.length === before) warn(token);
      }

      const content = lines.join('\n').replace(/\n{3,}/g, '\n\n');
      if (content !== original) {
        if (!this.dryRun) fs.writeFileSync(filePath, content, 'utf8');
        this.log(`✅ Cleaned docs: ${rule.file}`);
      }
    }
  }

  // The notifications demo hardcodes links to other feature pages
  // (/dashboard/workspaces, /dashboard/billing, /dashboard/kanban, …).
  // When those features are removed but notifications is kept, point the
  // now-dead links at a surviving route.
  remapNotificationLinks(removedUrls) {
    if (this.featuresToRemove.includes('notifications')) return;
    if (!removedUrls?.length) return;
    const notifDir = path.join(ROOT, 'src/features/notifications');
    if (!fs.existsSync(notifDir)) return;

    // Longest first so '/dashboard/workspaces/team' wins over '/dashboard/workspaces'
    const urls = removedUrls
      .filter((url) => url.startsWith('/dashboard'))
      .sort((a, b) => b.length - a.length);

    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, 'utf8');
          let updated = content;
          for (const url of urls) {
            updated = updated.split(url).join('/dashboard/overview');
          }
          if (updated !== content) {
            if (!this.dryRun) fs.writeFileSync(full, updated, 'utf8');
            this.log(`✅ Remapped dead demo links: ${path.relative(ROOT, full)}`);
          }
        }
      }
    };
    walk(notifDir);
  }

  cleanLaunchJson() {
    const launchPath = path.join(ROOT, '.vscode/launch.json');
    if (!fs.existsSync(launchPath)) return;

    let content = fs.readFileSync(launchPath, 'utf8');
    const before = content;

    content = content.replace(/,?\s*"NEXT_PUBLIC_SENTRY_DISABLED":\s*"[^"]*"/, '');
    content = content.replace(/,(\s*[}\]])/g, '$1');

    if (content !== before) {
      if (!this.dryRun) fs.writeFileSync(launchPath, content, 'utf8');
      this.log('✅ Cleaned .vscode/launch.json (removed NEXT_PUBLIC_SENTRY_DISABLED)');
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

    // Prefer the display names already configured in theme.config.ts
    // (e.g. 'WhatsApp', not the title-cased filename 'Whatsapp').
    const themeConfigPath = path.join(ROOT, 'src/components/themes/theme.config.ts');
    if (fs.existsSync(themeConfigPath)) {
      const configSource = fs.readFileSync(themeConfigPath, 'utf8');
      const existingNames = new Map();
      for (const m of configSource.matchAll(/\{\s*name:\s*'([^']*)',\s*value:\s*'([^']*)'\s*\}/g)) {
        existingNames.set(m[2], m[1]);
      }
      for (const theme of themes) {
        if (existingNames.has(theme.value)) theme.name = existingNames.get(theme.value);
      }
    }

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
    if (fs.existsSync(themeConfigPath)) {
      fs.writeFileSync(
        themeConfigPath,
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

    this.removeThemeSelector();
    this.pruneFontConfig(keep.file);
  }

  // With a single theme left, the selector is a dead one-item dropdown.
  removeThemeSelector() {
    const headerPath = path.join(ROOT, 'src/components/layout/header.tsx');
    const selectorPath = path.join(ROOT, 'src/components/themes/theme-selector.tsx');
    if (!fs.existsSync(selectorPath)) return;

    if (fs.existsSync(headerPath)) {
      let header = fs.readFileSync(headerPath, 'utf8');
      const before = header;
      header = header.replace(/import\s*\{\s*ThemeSelector\s*\}[^;]*;\n?/, '');
      header = header.replace(/\s*<div className='hidden sm:block'>\s*<ThemeSelector \/>\s*<\/div>/, '');
      if (header !== before) {
        fs.writeFileSync(headerPath, header, 'utf8');
        this.log('✅ Cleaned header.tsx (removed ThemeSelector)');
      }
    }

    fs.rmSync(selectorPath, { force: true });
    this.log('✅ Deleted: src/components/themes/theme-selector.tsx');
  }

  // Google-font loaders are eagerly downloaded at build time and their CSS
  // variables injected on every page — drop the ones the kept theme never
  // references.
  pruneFontConfig(keptThemeFile) {
    const fontConfigPath = path.join(ROOT, 'src/components/themes/font.config.ts');
    if (!fs.existsSync(fontConfigPath)) return;

    // Vars still referenced after the rewrite (+ the always-kept pair)
    const needed = new Set(['--font-sans', '--font-mono']);
    const cssFiles = [
      path.join(ROOT, 'src/styles/theme.css'),
      path.join(ROOT, 'src/styles/themes', keptThemeFile)
    ];
    for (const cssFile of cssFiles) {
      if (!fs.existsSync(cssFile)) continue;
      const css = fs.readFileSync(cssFile, 'utf8');
      for (const m of css.matchAll(/--font-[a-z0-9-]+/g)) needed.add(m[0]);
    }

    let source = fs.readFileSync(fontConfigPath, 'utf8');
    const blockRe = /const (\w+) = (\w+)\(\{[\s\S]*?variable: '(--font-[a-z0-9-]+)'[\s\S]*?\}\);/g;
    const blocks = [...source.matchAll(blockRe)];
    const variableCount = (source.match(/variable: '--font-/g) || []).length;
    if (blocks.length !== variableCount) {
      this.log(
        `⚠️  font.config.ts structure not recognized (parsed ${blocks.length} of ${variableCount} loaders) — skipping font pruning`
      );
      return;
    }

    const removed = blocks.filter((b) => !needed.has(b[3]));
    if (removed.length === 0) return;

    for (const block of removed) {
      source = source.replace(block[0], '');
    }

    // Drop the removed Google font names from the next/font/google import
    const removedFonts = new Set(removed.map((b) => b[2]));
    source = source.replace(/import \{([\s\S]*?)\} from 'next\/font\/google';/, (_, names) => {
      const keptNames = names
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n && !removedFonts.has(n));
      return `import {\n  ${keptNames.join(',\n  ')}\n} from 'next/font/google';`;
    });

    // Drop the removed locals from the fontVariables aggregation
    const removedLocals = new Set(removed.map((b) => b[1]));
    source = source.replace(/export const fontVariables = cn\(([\s\S]*?)\);/, (_, entries) => {
      const keptEntries = entries
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e && !removedLocals.has(e.replace('.variable', '')));
      return `export const fontVariables = cn(\n  ${keptEntries.join(',\n  ')}\n);`;
    });

    source = source.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(fontConfigPath, source, 'utf8');
    this.log(`✅ Pruned font.config.ts (removed ${removed.length} unused font loaders)`);
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
