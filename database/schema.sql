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

-- Textbook sections support books split into main book/workbook/etc.
CREATE TABLE IF NOT EXISTS st_textbook_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES st_textbooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_pages INT NOT NULL CHECK (total_pages > 0),
  current_page INT NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(textbook_id, name),
  CHECK (current_page <= total_pages)
);

-- Daily progress records for a textbook section.
CREATE TABLE IF NOT EXISTS st_study_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES st_students(id) ON DELETE CASCADE,
  textbook_id UUID NOT NULL REFERENCES st_textbooks(id) ON DELETE CASCADE,
  textbook_section_id UUID NOT NULL REFERENCES st_textbook_sections(id) ON DELETE CASCADE,
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

-- School events for exams, performance assessments, and school calendar items.
CREATE TABLE IF NOT EXISTS st_school_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES st_students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES st_subjects(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('midterm', 'final', 'performance', 'school', 'other')),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Migration support for databases created before textbook sections existed.
ALTER TABLE st_study_records
ADD COLUMN IF NOT EXISTS textbook_section_id UUID;

INSERT INTO st_textbook_sections (
  textbook_id,
  name,
  total_pages,
  current_page,
  sort_order
)
SELECT
  t.id,
  '본책',
  t.total_pages,
  t.current_page,
  0
FROM st_textbooks t
WHERE NOT EXISTS (
  SELECT 1
  FROM st_textbook_sections sec
  WHERE sec.textbook_id = t.id
);

UPDATE st_study_records r
SET textbook_section_id = sec.id
FROM st_textbook_sections sec
WHERE r.textbook_id = sec.textbook_id
  AND r.textbook_section_id IS NULL
  AND sec.sort_order = (
    SELECT MIN(sec2.sort_order)
    FROM st_textbook_sections sec2
    WHERE sec2.textbook_id = r.textbook_id
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'st_study_records_textbook_section_id_fkey'
  ) THEN
    ALTER TABLE st_study_records
    ADD CONSTRAINT st_study_records_textbook_section_id_fkey
    FOREIGN KEY (textbook_section_id)
    REFERENCES st_textbook_sections(id)
    ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE st_study_records
ALTER COLUMN textbook_section_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_st_textbooks_student_subject ON st_textbooks(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_st_textbooks_student_progress ON st_textbooks(student_id, current_page, total_pages);
CREATE INDEX IF NOT EXISTS idx_st_textbook_sections_textbook ON st_textbook_sections(textbook_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_st_study_records_student_date ON st_study_records(student_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_study_records_textbook_date ON st_study_records(textbook_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_study_records_section_date ON st_study_records(textbook_section_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_school_events_student_dates ON st_school_events(student_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_st_school_events_subject_date ON st_school_events(subject_id, start_date);
