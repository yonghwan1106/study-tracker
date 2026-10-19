import type { CurriculumType, Subject } from '@/types/database';

export interface HomeTextbook {
  id: string;
  name: string;
  curriculum_type: CurriculumType;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  subject?: Subject;
  cover_image_url: string | null;
  round_number: number;
  completed_round_count: number;
  is_completed: boolean;
}

export interface HomeStudyRecord {
  id: string;
  study_date: string;
  start_page: number | null;
  end_page: number;
  pages_done: number | null;
  round_number: number;
  subject?: Subject;
  textbook?: {
    name: string;
    cover_image_url: string | null;
    progress_percent: number;
  };
  textbook_section?: { name: string };
}

export interface HomeWeeklyStats {
  totalPages: number;
  recordCount: number;
  subjectBreakdown: { subject: Subject; pages: number }[];
}

export interface HomeData {
  textbooks: HomeTextbook[];
  todayRecords: HomeStudyRecord[];
  weeklyStats: HomeWeeklyStats;
}
