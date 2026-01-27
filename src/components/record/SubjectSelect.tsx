'use client';

import { Subject } from '@/types/database';

interface SubjectSelectProps {
  subjects: Subject[];
  value: string;
  onChange: (subjectId: string) => void;
}

const subjectEmojis: Record<string, string> = {
  '영어': '🔤',
  '수학': '🔢',
  '국어': '📝',
  '사회': '🌍',
  '과학': '🔬',
  '기타': '📚',
};

export default function SubjectSelect({ subjects, value, onChange }: SubjectSelectProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {subjects.map((subject) => {
        const isSelected = value === subject.id;
        const emoji = subjectEmojis[subject.name] || '📖';

        return (
          <button
            key={subject.id}
            type="button"
            onClick={() => onChange(subject.id)}
            className="relative p-4 rounded-2xl transition-all duration-300 text-center"
            style={{
              background: isSelected ? `${subject.color}20` : 'var(--card)',
              border: `2px solid ${isSelected ? subject.color : 'var(--border)'}`,
              boxShadow: isSelected ? `0 4px 20px ${subject.color}30` : 'var(--shadow-sm)',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <span
              className="text-2xl block mb-1 transition-transform duration-300"
              style={{
                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              {emoji}
            </span>
            <span
              className="text-sm font-medium block transition-colors duration-300"
              style={{
                color: isSelected ? subject.color : 'var(--foreground)',
              }}
            >
              {subject.name}
            </span>
            {isSelected && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                style={{ background: subject.color }}
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
