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
  cover_image_url TEXT,
  curriculum_type TEXT NOT NULL DEFAULT 'semester' CHECK (curriculum_type IN ('semester', 'year')),
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
  first_semester_target_page INT CHECK (
    first_semester_target_page IS NULL
    OR (first_semester_target_page >= 0 AND first_semester_target_page <= total_pages)
  ),
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

-- One shared setting keeps both students on the same school semester.
CREATE TABLE IF NOT EXISTS st_academic_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  current_semester SMALLINT NOT NULL DEFAULT 1 CHECK (current_semester IN (1, 2)),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO st_academic_settings (id, current_semester)
VALUES (TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- Migration support for databases created before textbook sections existed.
ALTER TABLE st_study_records
ADD COLUMN IF NOT EXISTS textbook_section_id UUID;

ALTER TABLE st_textbooks
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

ALTER TABLE st_textbooks
ADD COLUMN IF NOT EXISTS curriculum_type TEXT;

UPDATE st_textbooks
SET curriculum_type = CASE
  WHEN name LIKE '%1학년%' THEN 'year'
  ELSE 'semester'
END
WHERE curriculum_type IS NULL;

ALTER TABLE st_textbooks
ALTER COLUMN curriculum_type SET DEFAULT 'semester';

ALTER TABLE st_textbooks
ALTER COLUMN curriculum_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'st_textbooks_curriculum_type_check'
  ) THEN
    ALTER TABLE st_textbooks
    ADD CONSTRAINT st_textbooks_curriculum_type_check
    CHECK (curriculum_type IN ('semester', 'year'));
  END IF;
END $$;

ALTER TABLE st_textbook_sections
ADD COLUMN IF NOT EXISTS first_semester_target_page INT;

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

UPDATE st_textbook_sections sec
SET first_semester_target_page = CEIL(sec.total_pages / 2.0)::int
FROM st_textbooks t
WHERE sec.textbook_id = t.id
  AND t.curriculum_type = 'year'
  AND sec.first_semester_target_page IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'st_textbook_sections_first_semester_target_page_check'
  ) THEN
    ALTER TABLE st_textbook_sections
    ADD CONSTRAINT st_textbook_sections_first_semester_target_page_check
    CHECK (
      first_semester_target_page IS NULL
      OR (first_semester_target_page >= 0 AND first_semester_target_page <= total_pages)
    );
  END IF;
END $$;

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

-- Textbook rounds preserve each full pass through a book independently.
CREATE TABLE IF NOT EXISTS st_textbook_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES st_textbooks(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number > 0),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(textbook_id, round_number)
);

-- Each round has an independent current page for every main/workbook section.
CREATE TABLE IF NOT EXISTS st_textbook_round_section_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_round_id UUID NOT NULL REFERENCES st_textbook_rounds(id) ON DELETE CASCADE,
  textbook_section_id UUID NOT NULL REFERENCES st_textbook_sections(id) ON DELETE CASCADE,
  current_page INT NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(textbook_round_id, textbook_section_id)
);

ALTER TABLE st_study_records
ADD COLUMN IF NOT EXISTS textbook_round_id UUID;

-- Existing textbook progress becomes round 1 without changing any page values.
INSERT INTO st_textbook_rounds (
  textbook_id,
  round_number,
  status,
  started_at,
  completed_at
)
SELECT
  t.id,
  1,
  CASE WHEN t.current_page >= t.total_pages THEN 'completed' ELSE 'in_progress' END,
  COALESCE(
    (SELECT MIN(r.study_date)::timestamptz FROM st_study_records r WHERE r.textbook_id = t.id),
    t.created_at,
    NOW()
  ),
  CASE WHEN t.current_page >= t.total_pages THEN COALESCE(t.updated_at, NOW()) ELSE NULL END
FROM st_textbooks t
ON CONFLICT (textbook_id, round_number) DO NOTHING;

INSERT INTO st_textbook_round_section_progress (
  textbook_round_id,
  textbook_section_id,
  current_page
)
SELECT
  tr.id,
  sec.id,
  sec.current_page
FROM st_textbook_rounds tr
JOIN st_textbook_sections sec ON sec.textbook_id = tr.textbook_id
WHERE tr.round_number = 1
ON CONFLICT (textbook_round_id, textbook_section_id) DO NOTHING;

UPDATE st_study_records record
SET textbook_round_id = round.id
FROM st_textbook_rounds round
WHERE round.textbook_id = record.textbook_id
  AND round.round_number = 1
  AND record.textbook_round_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'st_study_records_textbook_round_id_fkey'
  ) THEN
    ALTER TABLE st_study_records
    ADD CONSTRAINT st_study_records_textbook_round_id_fkey
    FOREIGN KEY (textbook_round_id)
    REFERENCES st_textbook_rounds(id)
    ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE st_study_records
ALTER COLUMN textbook_round_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_st_textbooks_student_subject ON st_textbooks(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_st_textbooks_student_progress ON st_textbooks(student_id, current_page, total_pages);
CREATE INDEX IF NOT EXISTS idx_st_textbook_sections_textbook ON st_textbook_sections(textbook_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_st_study_records_student_date ON st_study_records(student_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_study_records_textbook_date ON st_study_records(textbook_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_study_records_section_date ON st_study_records(textbook_section_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_textbook_rounds_textbook_number ON st_textbook_rounds(textbook_id, round_number DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_st_textbook_rounds_one_in_progress
  ON st_textbook_rounds(textbook_id)
  WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_st_round_section_progress_round ON st_textbook_round_section_progress(textbook_round_id);
CREATE INDEX IF NOT EXISTS idx_st_study_records_round_date ON st_study_records(textbook_round_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_school_events_student_dates ON st_school_events(student_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_st_school_events_subject_date ON st_school_events(subject_id, start_date);
