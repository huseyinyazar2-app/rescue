import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'MatrixC Rescue',
  description: 'Owner console for MatrixC Rescue.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
