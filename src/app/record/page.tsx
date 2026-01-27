'use client';

import RecordForm from '@/components/record/RecordForm';
import { useStudent } from '@/components/layout/StudentContext';
import { Loader2 } from 'lucide-react';

export default function RecordPage() {
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
        <h1 className="text-2xl font-bold">{selectedStudent.name}의 학습 기록</h1>
        <p className="text-muted mt-1">오늘 공부한 내용을 기록해보세요</p>
      </div>

      <RecordForm />
    </div>
  );
}
