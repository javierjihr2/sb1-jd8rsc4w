
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
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
  // Esto asegura que Next.js exporte una app estática compatible con Capacitor
  output: 'export',
  // Y que la ponga en la carpeta 'out'
  distDir: 'out',
};

export default nextConfig;
