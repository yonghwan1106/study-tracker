'use client';

import { useStudent } from './StudentContext';
import StudentSelector from './StudentSelector';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { selectedStudent } = useStudent();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg hidden sm:block">학습관리</span>
          </Link>

          <div className="flex items-center gap-3">
            {selectedStudent && (
              <span className="text-sm text-muted hidden sm:block">
                {selectedStudent.name}의 학습
              </span>
            )}
            <StudentSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
