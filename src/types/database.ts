export interface Student {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  category: 'english' | 'math' | 'other';
  color: string;
  sort_order: number;
}

export interface StudyRecord {
  id: string;
  student_id: string;
  subject_id: string;
  study_date: string;
  textbook: string | null;
  study_range: string | null;
  duration_minutes: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  subject?: Subject;
}

export interface WeeklyGoal {
  id: string;
  student_id: string;
  subject_id: string;
  year: number;
  week_number: number;
  target_minutes: number;
  created_at: string;
  // Joined fields
  subject?: Subject;
}

export interface Textbook {
  id: string;
  subject_id: string;
  name: string;
  created_at: string;
}

export interface DailyStats {
  date: string;
  total_minutes: number;
  records: StudyRecord[];
}

export interface SubjectStats {
  subject: Subject;
  total_minutes: number;
  record_count: number;
}
