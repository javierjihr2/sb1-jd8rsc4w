import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Removido output: 'export' para habilitar Server Components en desarrollo
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flagsapi.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configuración para exportación estática compatible con Capacitor
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configuración mínima de fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        module: false,
        async_hooks: false,
        'node:fs': false,
        'node:perf_hooks': false,
        'node:crypto': false,
        'node:buffer': false,
        'node:stream': false,
        'node:util': false,
        'node:path': false,
        'node:os': false,
      };
      
      // Plugin personalizado para manejar esquemas node:
      class NodeSchemePlugin {
        apply(compiler: any) {
          compiler.hooks.normalModuleFactory.tap('NodeSchemePlugin', (factory: any) => {
            factory.hooks.beforeResolve.tap('NodeSchemePlugin', (resolveData: any) => {
              if (resolveData.request && resolveData.request.startsWith('node:')) {
                resolveData.request = 'data:text/javascript,module.exports = {};';
              }
            });
          });
        }
      }
      
      // Reemplazos de módulos problemáticos
      const webpack = require('webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new NodeSchemePlugin(),
        new webpack.NormalModuleReplacementPlugin(
          /@opentelemetry/,
          'data:text/javascript,module.exports = {};'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /@genkit-ai\/firebase/,
          'data:text/javascript,module.exports = {};'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /handlebars/,
          'data:text/javascript,module.exports = {};'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /@genkit-ai\/ai/,
          'data:text/javascript,module.exports = {};'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /genkit/,
          'data:text/javascript,module.exports = {};'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /fetch-blob/,
          'data:text/javascript,module.exports = {};'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node-fetch/,
          'data:text/javascript,module.exports = {};'
        )
      );
    }
    return config;
  },
};

export default nextConfig;
