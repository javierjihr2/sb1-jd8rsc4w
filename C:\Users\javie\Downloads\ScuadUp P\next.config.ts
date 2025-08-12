
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  // Forzamos la salida a la carpeta 'public' para compatibilidad directa con Capacitor
  distDir: 'public',
  // Aseguramos que se exporte una app estática
  output: 'export',
};

export default nextConfig;
