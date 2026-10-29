const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('pfx');
config.resolver.assetExts.push('p12');
config.resolver.assetExts.push('txt');

module.exports = config;
