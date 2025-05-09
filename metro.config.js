const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro'); // Assuming you still use NativeWind

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// For Node.js module polyfills
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  stream: require.resolve('readable-stream'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  crypto: require.resolve('react-native-crypto'),
  buffer: require.resolve('buffer/'),
  net: require.resolve('react-native-tcp-socket'),
  tls: false, // Mock the tls module
};

// If you specifically need to disable package exports
config.resolver.unstable_enablePackageExports = false;

// Apply NativeWind configuration if used
// module.exports = withNativeWind(config, { input: './global.css' });
// If not using NativeWind, then just:
module.exports = config;
