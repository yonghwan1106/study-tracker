'use client';

import { Subject } from '@/types/database';

interface SubjectSelectProps {
  subjects: Subject[];
  value: string;
  onChange: (subjectId: string) => void;
}

export default function SubjectSelect({ subjects, value, onChange }: SubjectSelectProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {subjects.map((subject) => (
        <button
          key={subject.id}
          type="button"
          onClick={() => onChange(subject.id)}
          className={`px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
            value === subject.id
              ? 'border-current'
              : 'border-border hover:border-current/50'
          }`}
          style={{
            color: value === subject.id ? subject.color : undefined,
            backgroundColor: value === subject.id ? `${subject.color}15` : undefined,
          }}
        >
          {subject.name}
        </button>
      ))}
    </div>
  );
}
