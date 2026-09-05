import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  const variants = {
    primary: 'border-gold bg-gold text-navy hover:bg-cream',
    secondary: 'border-cream/30 bg-white/10 text-cream hover:bg-white/20',
    danger: 'border-red-300 bg-red-700 text-white hover:bg-red-600',
  };

  return (
    <button
      className={`rounded-xl border px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function TextField({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-xl border border-cream/30 bg-navy-2 px-3 py-2 text-cream placeholder:text-cream/50 outline-none focus:border-gold ${className}`}
      {...props}
    />
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-navy text-cream">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-3xl font-black tracking-wide text-gold">
            Get a Clue
          </Link>
          <Link href="/sets" className="rounded-lg border border-cream/20 px-3 py-2 text-sm hover:bg-white/10">
            Question Sets
          </Link>
        </header>
        {children}
      </div>
    </main>
  );
}
