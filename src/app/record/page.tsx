'use client';

import RecordForm from '@/components/record/RecordForm';
import { useStudent } from '@/components/layout/StudentContext';

const studentConfig: Record<string, { emoji: string; color: string }> = {
  '박건호': { emoji: '🧑‍💻', color: '#4f8fea' },
  '박도윤': { emoji: '🎨', color: '#34c88a' },
};

export default function RecordPage() {
  const { selectedStudent, loading } = useStudent();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--border)] animate-pulse" />
        <div className="w-32 h-4 rounded-full bg-[var(--border)] animate-pulse" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl mb-4 block">📚</span>
        <p className="text-[var(--muted)]">학생을 먼저 선택해주세요.</p>
      </div>
    );
  }

  const config = studentConfig[selectedStudent.name] || {
    emoji: '👤',
    color: '#8b9aaa',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="glass-card p-5 text-center animate-fade-in-up"
        style={{
          background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%)`,
          borderColor: `${config.color}30`,
        }}
      >
        <span className="text-4xl mb-2 block">{config.emoji}</span>
        <h1 className="text-xl font-bold">{selectedStudent.name.slice(1)}의 교재 진도</h1>
        <p className="text-[var(--muted)] text-sm mt-1">오늘 어디까지 풀었는지 기록해요 ✨</p>
      </div>

      <RecordForm />
    </div>
  );
}
