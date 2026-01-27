'use client';

import StudentSelector from './StudentSelector';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--card)] border-b border-[var(--card-border)]">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:animate-float">📚</span>
            <span className="font-semibold text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] bg-clip-text text-transparent">
              학습관리
            </span>
          </Link>

          <StudentSelector />
        </div>
      </div>
    </header>
  );
}
