import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'TeamUp: PUBG Mobile',
  description: 'Encuentra tu equipo ideal para PUBG Mobile',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head/>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
