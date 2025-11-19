// metro.config.js

// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ⭐️ Add this resolver configuration ⭐️
config.resolver.sourceExts.push(
    'cjs'
);

// This ensures Metro can properly find the files inside date-fns
// that are referenced without the .js extension in its module files.
config.resolver.extraNodeModules = {
  'date-fns': require.resolve('date-fns'),
};

module.exports = config;