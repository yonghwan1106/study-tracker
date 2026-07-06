'use client';

import SchoolEventCalendar from '@/components/events/SchoolEventCalendar';
import { useStudent } from '@/components/layout/StudentContext';
import { Loader2 } from 'lucide-react';

export default function EventsPage() {
  const { selectedStudent, loading } = useStudent();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">학생을 먼저 선택해주세요.</p>
      </div>
    );
  }

  return <SchoolEventCalendar />;
}
