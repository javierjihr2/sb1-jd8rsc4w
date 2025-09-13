import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from './auth-provider';
import { NotificationProvider } from '@/components/notification-provider';
import { QueryProvider } from '@/providers/query-provider';
import ErrorBoundary from '@/components/error-boundary';
import '@/lib/error-suppression'; // Suprimir errores de red no críticos

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SquadGO',
  description: 'SquadGO - ¡Encuentra amigos ya!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head/>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <NotificationProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  <Toaster />
                </ThemeProvider>
              </NotificationProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
