const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./cleanup-config');

const ROOT = process.cwd();

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

class FeatureCleanup {
  constructor(features, options = {}) {
    this.featuresToRemove = Array.isArray(features) ? features : [features];
    this.force = options.force === true;
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

    console.log('🧹 Starting feature cleanup...\n');

    for (const featureName of this.featuresToRemove) {
      const feature = config.features[featureName];

      if (!feature) {
        console.log(`⚠️  Unknown feature: ${featureName}`);
        continue;
      }

      console.log(`\n📦 Removing ${feature.name}...`);

      this.deleteFolders(feature);
      this.deleteFiles(feature);
      this.writeTemplateFiles(feature);
      this.writeReplacements(feature);
      this.cleanDependencies(feature);
      this.cleanEnvVars(feature);
      if (feature.cleanNextConfig) {
        this.cleanNextConfig(feature);
      }
      if (feature.navItemsToRemove && feature.navItemsToRemove.length > 0) {
        this.cleanNavConfig(feature);
      }
      this.cleanDocReferences(feature);
    }

    console.log('\n✨ Cleanup complete!\n');
    this.showNextSteps();
  }

  writeTemplateFiles(feature) {
    if (!feature.templateDir || !feature.templateFiles) return;

    const templateDir = path.join(ROOT, feature.templateDir);
    if (!fs.existsSync(templateDir)) return;

    Object.entries(feature.templateFiles).forEach(
      ([destPath, templateFilename]) => {
        const templatePath = path.join(templateDir, templateFilename);
        if (!fs.existsSync(templatePath)) return;

        const destFullPath = path.join(ROOT, destPath);
        const destDir = path.dirname(destFullPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        const content = fs.readFileSync(templatePath, 'utf8');
        fs.writeFileSync(destFullPath, content, 'utf8');
        console.log(`  ✅ Wrote: ${destPath}`);
      }
    );
  }

  deleteFolders(feature) {
    if (!feature.folders) return;
    feature.folders.forEach((folder) => {
      const fullPath = path.join(ROOT, folder);

      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`  ✅ Deleted folder: ${folder}`);
        }
      }
    });
  }

  deleteFiles(feature) {
    if (!feature.files || feature.files.length === 0) return;
    feature.files.forEach((file) => {
      const fullPath = path.join(ROOT, file);

      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { force: true });
        console.log(`  ✅ Deleted file: ${file}`);
      }
    });
  }

  writeReplacements(feature) {
    if (!feature.replacements || typeof feature.replacements !== 'object')
      return;
    const proxyDocUrl = 'https://nextjs.org/docs/messages/middleware-to-proxy';
    Object.entries(feature.replacements).forEach(([filePath, content]) => {
      const fullPath = path.join(ROOT, filePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content.trimEnd() + '\n', 'utf8');
      console.log(`  ✅ Wrote: ${filePath}`);
      if (filePath === 'src/proxy.ts') {
        console.log(
          `     (Next.js uses "proxy" instead of deprecated "middleware": ${proxyDocUrl})`
        );
      }
    });
  }

  cleanDependencies(feature) {
    if (!feature.dependencies || feature.dependencies.length === 0) return;

    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    let removed = 0;
    feature.dependencies.forEach((dep) => {
      if (pkg.dependencies?.[dep]) {
        delete pkg.dependencies[dep];
        removed++;
      }
      if (pkg.devDependencies?.[dep]) {
        delete pkg.devDependencies[dep];
        removed++;
      }
    });

    if (removed > 0) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      console.log(`  ✅ Removed ${removed} dependencies`);
    }
  }

  cleanEnvVars(feature) {
    if (!feature.envVars || feature.envVars.length === 0) return;

    const envFiles = ['.env.local', '.env.example', '.env', 'env.example.txt'];

    envFiles.forEach((envFile) => {
      const envPath = path.join(ROOT, envFile);

      if (!fs.existsSync(envPath)) return;

      let content = fs.readFileSync(envPath, 'utf8');
      let modified = false;

      feature.envVars.forEach((envVar) => {
        const regex = new RegExp(`^${envVar}=.*$`, 'gm');
        if (regex.test(content)) {
          content = content.replace(regex, '');
          modified = true;
        }
        const commentBlockRegex = new RegExp(`(#.*\\n)?^${envVar}=.*$`, 'gm');
        if (commentBlockRegex.test(content)) {
          content = content.replace(commentBlockRegex, '');
          modified = true;
        }
      });

      if (modified) {
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        fs.writeFileSync(envPath, content, 'utf8');
        console.log(`  ✅ Cleaned ${envFile}`);
      }
    });
  }

  cleanNextConfig(feature) {
    const configPath = path.join(ROOT, 'next.config.ts');
    if (!fs.existsSync(configPath)) return;

    let content = fs.readFileSync(configPath, 'utf8');
    const before = content;
    content = content.replace(
      /,\s*\{\s*protocol:\s*['"]https['"],\s*hostname:\s*['"]img\.clerk\.com['"][^}]*\}/g,
      ''
    );
    content = content.replace(
      /,\s*\{\s*protocol:\s*['"]https['"],\s*hostname:\s*['"]clerk\.com['"][^}]*\}/g,
      ''
    );
    if (content !== before) {
      fs.writeFileSync(configPath, content, 'utf8');
      console.log('  ✅ Cleaned next.config.ts (Clerk image hostnames)');
    }
  }

  cleanNavConfig(feature) {
    if (
      feature.templateFiles &&
      feature.templateFiles['src/config/nav-config.ts']
    )
      return;
    const navPath = path.join(ROOT, 'src/config/nav-config.ts');
    if (!fs.existsSync(navPath)) return;

    const replacement = `import { NavItem } from '@/types';

/**
 * Navigation configuration
 * Used by sidebar and Cmd+K bar.
 */
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Product',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: []
  },
  {
    title: 'Account',
    url: '#',
    icon: 'account',
    isActive: true,
    items: [
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  }
];
`;

    fs.writeFileSync(navPath, replacement, 'utf8');
    console.log('  ✅ Cleaned nav-config.ts (removed Clerk nav items)');
  }

  cleanDocReferences(feature) {
    if (feature.name.toLowerCase().indexOf('clerk') === -1) return;

    const docFiles = [
      path.join(ROOT, 'README.md'),
      path.join(ROOT, 'docs/nav-rbac.md'),
      path.join(ROOT, 'src/config/infoconfig.ts')
    ];

    docFiles.forEach((filePath) => {
      if (!fs.existsSync(filePath)) return;
      let content = fs.readFileSync(filePath, 'utf8');
      const before = content;
      content = content.replace(
        /\n*# Clerk Setup Guide[\s\S]*?(?=\n#|\n##|\Z)/gi,
        '\n'
      );
      content = content.replace(/Clerk['\s]/gi, 'Auth ');
      content = content.replace(/clerk\.com[^\s]*/gi, '');
      if (content !== before) {
        fs.writeFileSync(
          filePath,
          content.replace(/\n\s*\n\s*\n/g, '\n\n'),
          'utf8'
        );
        console.log(
          `  ✅ Cleaned doc references: ${path.relative(ROOT, filePath)}`
        );
      }
    });
  }

  showNextSteps() {
    console.log('📋 Next steps:');
    console.log(
      '  1. Run: npm install (or bun install) to remove unused dependencies'
    );
    console.log('  2. Review and test your application');
    console.log('  3. To revert cleanup: git restore . (or git checkout .)');
    console.log(
      '  4. Next.js proxy: the "middleware" file convention is deprecated; this cleanup uses src/proxy.ts (see https://nextjs.org/docs/messages/middleware-to-proxy)'
    );
    console.log('  5. Delete this cleanup script if no longer needed\n');
  }
}

function showHelp() {
  console.log(`
🧹 Feature Cleanup Tool

Usage:
  node __CLEANUP__/scripts/cleanup.js [features...]

Examples:
  node __CLEANUP__/scripts/cleanup.js clerk
  node __CLEANUP__/scripts/cleanup.js --list
  node __CLEANUP__/scripts/cleanup.js --help
  node __CLEANUP__/scripts/cleanup.js clerk --force   # skip git safety check

Safety:
  Before running, the script checks for a git repo with at least one commit
  so you can revert (git restore .) if needed. Use --force to skip this check.

Available features:
${Object.entries(config.features)
  .map(([key, value]) => `  - ${key.padEnd(15)} ${value.name}`)
  .join('\n')}
  `);
}

function listFeatures() {
  console.log('\n📦 Available features:\n');
  Object.entries(config.features).forEach(([key, value]) => {
    console.log(`  ${key}`);
    console.log(`    Name: ${value.name}`);
    console.log(`    Folders: ${(value.folders || []).length}`);
    console.log(`    Dependencies: ${(value.dependencies || []).length}`);
    console.log('');
  });
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const filteredArgs = args.filter((a) => a !== '--force');

  if (filteredArgs.length === 0 || filteredArgs.includes('--help')) {
    showHelp();
    return;
  }

  if (filteredArgs.includes('--list')) {
    listFeatures();
    return;
  }

  if (filteredArgs.includes('--all')) {
    const allFeatures = Object.keys(config.features);
    const cleanup = new FeatureCleanup(allFeatures, { force });
    await cleanup.cleanup();
    return;
  }

  const features = filteredArgs.filter((a) => !a.startsWith('-'));
  const cleanup = new FeatureCleanup(features, { force });
  await cleanup.cleanup();
}

main().catch(console.error);

module.exports = { FeatureCleanup, showHelp, listFeatures };
