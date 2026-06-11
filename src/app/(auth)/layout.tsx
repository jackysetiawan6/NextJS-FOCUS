
import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 sm:p-6">
      <header className="w-full py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span>Facility Operation Center</span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="w-full py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} Facility Operation Center. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
