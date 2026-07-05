export interface Student {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  category: 'korean' | 'english' | 'math' | 'science' | 'social';
  color: string;
  sort_order: number;
}

export interface Textbook {
  id: string;
  student_id: string;
  subject_id: string;
  name: string;
  total_pages: number;
  current_page: number;
  progress_percent: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject;
}

export interface StudyRecord {
  id: string;
  student_id: string;
  textbook_id: string;
  subject_id: string;
  study_date: string;
  start_page: number | null;
  end_page: number;
  pages_done: number | null;
  duration_minutes: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  textbook?: Textbook;
}

export interface DailyStats {
  date: string;
  total_pages: number;
  records: StudyRecord[];
}

export interface SubjectStats {
  subject: Subject;
  total_pages: number;
  record_count: number;
}
