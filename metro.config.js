const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver.extraNodeModules || {}),
    stream: require.resolve('readable-stream'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    crypto: require.resolve('react-native-crypto'),
    buffer: require.resolve('buffer/'),
    net: require.resolve('react-native-tcp-socket'),
    tls: false,
  },
  unstable_enablePackageExports: false,
};

module.exports = withNativeWind(config, { input: './global.css' });