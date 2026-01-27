'use client';

import { useState } from 'react';
import { useStudent } from './StudentContext';
import { ChevronDown, User } from 'lucide-react';

export default function StudentSelector() {
  const { students, selectedStudent, setSelectedStudent, loading } = useStudent();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-28 h-10 bg-border animate-pulse rounded-lg" />
    );
  }

  if (!selectedStudent) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:bg-background transition-colors"
      >
        <User className="w-4 h-4" />
        <span className="font-medium">{selectedStudent.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-background transition-colors flex items-center gap-2 ${
                  selectedStudent.id === student.id ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <User className="w-4 h-4" />
                {student.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
