const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure that all platform extensions are supported
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Add support for expo-router
config.resolver.unstable_enableSymlinks = true;

// Extended file extensions for better module resolution
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx',
  'js',
  'ts',
  'tsx',
  'json',
  'svg'
];

// Asset extensions for optimized loading
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2'
];

// Performance optimizations for 120 FPS and bundle size
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_keys: true,
    wrap_iife: true,
  },
  sourceMap: {
    includeSources: false,
  },
  toplevel: false,
  compress: {
    reduce_funcs: false,
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      dead_code: true,
      unused: true
    })
  },
};

// Enable Hermes optimizations
config.transformer.hermesCommand = 'hermes';
config.transformer.enableBabelRCLookup = false;

// Advanced bundle optimization
config.serializer = {
  ...config.serializer,
  // Custom module ID factory for better caching
  createModuleIdFactory: () => {
    const fileToIdMap = new Map();
    let nextId = 0;
    return (path) => {
      if (!fileToIdMap.has(path)) {
        fileToIdMap.set(path, nextId++);
      }
      return fileToIdMap.get(path);
    };
  },
  // Filter out test files and development dependencies in production
  processModuleFilter: (module) => {
    if (process.env.NODE_ENV === 'production') {
      if (module.path.includes('__tests__')) return false;
      if (module.path.includes('.test.')) return false;
      if (module.path.includes('.spec.')) return false;
      if (module.path.includes('storybook')) return false;
    }
    return true;
  },
  // Optimize module loading order
  getModulesRunBeforeMainModule: () => [
    require.resolve('react-native/Libraries/Core/InitializeCore'),
  ],
};

// Optimize bundle size and loading
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Blacklist unnecessary files for better performance
config.resolver.blacklistRE = /(\/android\/.*|\/ios\/.*|\/node_modules\/.*\/android\/.*|\/node_modules\/.*\/ios\/.*|.*\/__tests__\/.*|.*\.test\.(js|jsx|ts|tsx)|.*\.spec\.(js|jsx|ts|tsx)|.*\.stories\.(js|jsx|ts|tsx))/;

// Optimize node modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Development server optimizations
config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add caching headers for static assets
      if (req.url.includes('.bundle') || req.url.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
      return middleware(req, res, next);
    };
  },
};

// Bundle analysis configuration
if (process.env.ANALYZE_BUNDLE) {
  config.serializer.createModuleIdFactory = () => {
    return (modulePath) => {
      // Use relative paths for better bundle analysis
      return path.relative(__dirname, modulePath);
    };
  };
}

module.exports = config;