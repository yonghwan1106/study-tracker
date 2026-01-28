'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface StudentContextType {
  students: Student[];
  selectedStudent: Student | null;
  setSelectedStudent: (student: Student) => void;
  loading: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STORAGE_KEY = 'study-tracker-selected-student';

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudentState] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
        return;
      }

      setStudents(data || []);

      // Restore last selected student from localStorage
      const savedStudentId = localStorage.getItem(STORAGE_KEY);
      if (savedStudentId && data) {
        const savedStudent = data.find(s => s.id === savedStudentId);
        if (savedStudent) {
          setSelectedStudentState(savedStudent);
        } else if (data.length > 0) {
          setSelectedStudentState(data[0]);
        }
      } else if (data && data.length > 0) {
        setSelectedStudentState(data[0]);
      }

      setLoading(false);
    }

    fetchStudents();
  }, []);

  const setSelectedStudent = (student: Student) => {
    setSelectedStudentState(student);
    localStorage.setItem(STORAGE_KEY, student.id);
  };

  return (
    <StudentContext.Provider value={{ students, selectedStudent, setSelectedStudent, loading }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
