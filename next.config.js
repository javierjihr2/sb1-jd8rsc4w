/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Exclude functions directory from build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transpilePackages: [],
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Optimización para reducir errores de compilación
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      http2: false,
      child_process: false,
      worker_threads: false,
      perf_hooks: false,
      os: false,
      crypto: false,
      stream: false,
      util: false,
      url: false,
      querystring: false,
      path: false,
      assert: false,
      buffer: false,
      'node:buffer': false,
      'node:stream': false,
      'node:util': false,
      'node:url': false,
      'node:path': false,
      'node:fs': false,
      'node:crypto': false,
      'node:os': false,
      'node:http': false,
      'node:https': false,
      'node:zlib': false,
    };

    // Excluir módulos de Node.js del bundle del cliente
    if (!isServer) {
      config.externals = {
        ...config.externals,
        '@genkit-ai/googleai': 'commonjs @genkit-ai/googleai',
        '@genkit-ai/core': 'commonjs @genkit-ai/core',
        'genkit': 'commonjs genkit',
      };
    }
    
    // Suprimir warnings específicos
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'fs'/,
      /Module not found: Can't resolve 'net'/,
      /Module not found: Can't resolve 'tls'/,
      /Module not found: Can't resolve 'http2'/,
      /Module not found: Can't resolve 'child_process'/,
      /Module not found: Can't resolve 'worker_threads'/,
      /Module not found: Can't resolve 'perf_hooks'/,
      /Module not found: Can't resolve 'os'/,
      /Module not found: Can't resolve 'crypto'/,
      /Module not found: Can't resolve 'stream'/,
      /Module not found: Can't resolve 'util'/,
      /Module not found: Can't resolve 'url'/,
      /Module not found: Can't resolve 'querystring'/,
      /Module not found: Can't resolve 'path'/,
      /Module not found: Can't resolve 'assert'/,
      /Module not found: Can't resolve 'buffer'/,
      /Module not found: Can't resolve 'node:buffer'/,
      /Module not found: Can't resolve 'node:stream'/,
      /Module not found: Can't resolve 'node:util'/,
      /Module not found: Can't resolve 'node:url'/,
      /Module not found: Can't resolve 'node:path'/,
      /Module not found: Can't resolve 'node:fs'/,
      /Module not found: Can't resolve 'node:crypto'/,
      /Module not found: Can't resolve 'node:os'/,
      /Module not found: Can't resolve 'node:http'/,
      /Module not found: Can't resolve 'node:https'/,
      /Module not found: Can't resolve 'node:zlib'/,
    ];
    
    // Exclude functions directory from compilation
    if (Array.isArray(config.externals)) {
      config.externals.push({
        'firebase-functions': 'firebase-functions'
      });
    } else {
      config.externals = {
        ...config.externals,
        'firebase-functions': 'firebase-functions'
      };
    }
    
    // Ignore functions directory
    config.plugins = config.plugins || [];
    config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/functions/,
          contextRegExp: /$/
        })
      );
    
    return config;
  },
  // Configuración para service workers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;