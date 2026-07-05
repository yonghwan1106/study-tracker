-- Study Tracker Database Schema for Neon Postgres

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Students table
CREATE TABLE IF NOT EXISTS st_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO st_students (name) VALUES ('박건호'), ('박도윤')
ON CONFLICT (name) DO NOTHING;

-- Subjects table
CREATE TABLE IF NOT EXISTS st_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

INSERT INTO st_subjects (name, category, color, sort_order) VALUES
  ('국어', 'korean', '#10B981', 1),
  ('영어', 'english', '#3B82F6', 2),
  ('수학', 'math', '#EF4444', 3),
  ('과학', 'science', '#8B5CF6', 4),
  ('사회', 'social', '#F59E0B', 5)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Textbooks are the core unit of progress tracking.
CREATE TABLE IF NOT EXISTS st_textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES st_students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES st_subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_pages INT NOT NULL CHECK (total_pages > 0),
  current_page INT NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, name),
  CHECK (current_page <= total_pages)
);

-- Daily progress records for a textbook.
CREATE TABLE IF NOT EXISTS st_study_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES st_students(id) ON DELETE CASCADE,
  textbook_id UUID NOT NULL REFERENCES st_textbooks(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES st_subjects(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  start_page INT CHECK (start_page IS NULL OR start_page >= 0),
  end_page INT NOT NULL CHECK (end_page > 0),
  duration_minutes INT CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (start_page IS NULL OR end_page >= start_page)
);

CREATE INDEX IF NOT EXISTS idx_st_textbooks_student_subject ON st_textbooks(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_st_textbooks_student_progress ON st_textbooks(student_id, current_page, total_pages);
CREATE INDEX IF NOT EXISTS idx_st_study_records_student_date ON st_study_records(student_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_study_records_textbook_date ON st_study_records(textbook_id, study_date);
