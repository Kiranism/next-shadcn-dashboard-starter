const inquirer = require('inquirer');
const { FeatureCleanup } = require('./cleanup');
const config = require('./cleanup-config');

async function interactive() {
  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to remove:',
      choices: Object.entries(config.features).map(([key, value]) => ({
        name: `${value.name} (${key})`,
        value: key
      }))
    }
  ]);

  if (features.length === 0) {
    console.log('No features selected. Exiting.');
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove ${features.length} feature(s)?`,
      default: false
    }
  ]);

  if (!confirm) {
    console.log('Cancelled.');
    return;
  }

  const cleanup = new FeatureCleanup(features);
  await cleanup.cleanup();
}

interactive().catch(console.error);
