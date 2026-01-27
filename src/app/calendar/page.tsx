'use client';

import StudyCalendar from '@/components/calendar/StudyCalendar';
import { useStudent } from '@/components/layout/StudentContext';
import { Loader2 } from 'lucide-react';

export default function CalendarPage() {
  const { selectedStudent, loading } = useStudent();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">학생을 먼저 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{selectedStudent.name}의 학습 캘린더</h1>
        <p className="text-muted mt-1">날짜를 클릭해서 상세 내용을 확인하세요</p>
      </div>

      <StudyCalendar />
    </div>
  );
}
