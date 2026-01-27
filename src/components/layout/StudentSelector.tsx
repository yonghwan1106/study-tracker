'use client';

import { useStudent } from './StudentContext';

export default function StudentSelector() {
  const { students, selectedStudent, setSelectedStudent, loading } = useStudent();

  if (loading) {
    return (
      <div className="w-40 h-10 bg-border animate-pulse rounded-lg" />
    );
  }

  if (!selectedStudent || students.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
      {students.map((student) => {
        const isSelected = selectedStudent.id === student.id;
        return (
          <button
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className={`px-4 py-2 font-medium transition-all ${
              isSelected
                ? 'bg-primary text-white'
                : 'text-muted hover:text-foreground hover:bg-background'
            }`}
          >
            {student.name}
          </button>
        );
      })}
    </div>
  );
}
