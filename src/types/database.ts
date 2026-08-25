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
  cover_image_url: string | null;
  curriculum_type: CurriculumType;
  total_pages: number;
  current_page: number;
  progress_percent: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  sections?: TextbookSection[];
  rounds: TextbookRound[];
  active_round: TextbookRound;
  school_progress?: SchoolProgress;
}

export type CurriculumType = 'semester' | 'year';

export interface SchoolProgress {
  current_semester: 1 | 2;
  current_pages: number;
  target_pages: number;
  progress_percent: number;
  is_completed: boolean;
}

export interface TextbookSection {
  id: string;
  textbook_id: string;
  name: string;
  total_pages: number;
  first_semester_target_page: number | null;
  current_page: number;
  progress_percent: number;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TextbookRoundStatus = 'in_progress' | 'completed';

export interface TextbookRound {
  id: string;
  textbook_id: string;
  round_number: number;
  status: TextbookRoundStatus;
  started_at: string;
  completed_at: string | null;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  is_completed: boolean;
}

export interface StudyRecord {
  id: string;
  student_id: string;
  textbook_id: string;
  textbook_round_id: string;
  textbook_section_id: string;
  subject_id: string;
  study_date: string;
  start_page: number | null;
  end_page: number;
  pages_done: number | null;
  duration_minutes: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  round_number: number;
  subject?: Subject;
  textbook?: Textbook;
  round?: TextbookRound;
  textbook_section?: TextbookSection;
}

export type SchoolEventType = 'midterm' | 'final' | 'performance' | 'school' | 'other';

export interface SchoolEvent {
  id: string;
  student_id: string;
  subject_id: string | null;
  event_type: SchoolEventType;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  subject?: Subject | null;
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
