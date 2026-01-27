'use client';

import { useStudent } from './StudentContext';

const studentConfig: Record<string, { emoji: string; color: string; bgColor: string; glowColor: string }> = {
  '박건호': {
    emoji: '🧑‍💻',
    color: '#4f8fea',
    bgColor: 'rgba(79, 143, 234, 0.15)',
    glowColor: 'rgba(79, 143, 234, 0.3)',
  },
  '박도윤': {
    emoji: '🎨',
    color: '#34c88a',
    bgColor: 'rgba(52, 200, 138, 0.15)',
    glowColor: 'rgba(52, 200, 138, 0.3)',
  },
};

export default function StudentSelector() {
  const { students, selectedStudent, setSelectedStudent, loading } = useStudent();

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="w-24 h-12 bg-[var(--border)] animate-pulse rounded-2xl" />
        <div className="w-24 h-12 bg-[var(--border)] animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!selectedStudent || students.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {students.map((student) => {
        const isSelected = selectedStudent.id === student.id;
        const config = studentConfig[student.name] || {
          emoji: '👤',
          color: '#8b9aaa',
          bgColor: 'rgba(139, 154, 170, 0.15)',
          glowColor: 'rgba(139, 154, 170, 0.3)',
        };

        return (
          <button
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium transition-all duration-300 ease-out"
            style={{
              background: isSelected ? config.bgColor : 'transparent',
              color: isSelected ? config.color : 'var(--muted)',
              boxShadow: isSelected ? `0 4px 20px ${config.glowColor}` : 'none',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              border: isSelected ? `2px solid ${config.color}40` : '2px solid transparent',
            }}
          >
            <span
              className="text-xl transition-transform duration-300"
              style={{
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {config.emoji}
            </span>
            <span className="text-sm">{student.name.slice(1)}</span>
            {isSelected && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
