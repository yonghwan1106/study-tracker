-- Study Tracker Database Schema (st_ prefix)
-- 기존 til-calendar 프로젝트와 함께 사용 가능

-- Students table
CREATE TABLE IF NOT EXISTS st_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial student data
INSERT INTO st_students (name) VALUES ('박건호'), ('박도윤')
ON CONFLICT DO NOTHING;

-- Subjects table
CREATE TABLE IF NOT EXISTS st_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- Initial subjects data
INSERT INTO st_subjects (name, category, color, sort_order) VALUES
  ('영어', 'english', '#3B82F6', 1),
  ('수학', 'math', '#EF4444', 2),
  ('국어', 'other', '#10B981', 3),
  ('사회', 'other', '#F59E0B', 4),
  ('과학', 'other', '#8B5CF6', 5),
  ('기타', 'other', '#6B7280', 6)
ON CONFLICT DO NOTHING;

-- Study records table
CREATE TABLE IF NOT EXISTS st_study_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES st_students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES st_subjects(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  textbook TEXT,
  study_range TEXT,
  duration_minutes INT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly goals table
CREATE TABLE IF NOT EXISTS st_weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES st_students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES st_subjects(id) ON DELETE CASCADE,
  year INT NOT NULL,
  week_number INT NOT NULL,
  target_minutes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, year, week_number)
);

-- Textbooks table (for autocomplete)
CREATE TABLE IF NOT EXISTS st_textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES st_subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_st_study_records_student_date ON st_study_records(student_id, study_date);
CREATE INDEX IF NOT EXISTS idx_st_study_records_date ON st_study_records(study_date);
CREATE INDEX IF NOT EXISTS idx_st_weekly_goals_student_week ON st_weekly_goals(student_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_st_textbooks_subject ON st_textbooks(subject_id);

-- Enable RLS
ALTER TABLE st_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE st_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE st_study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE st_weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE st_textbooks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (public access)
CREATE POLICY "Allow all on st_students" ON st_students FOR ALL USING (true);
CREATE POLICY "Allow all on st_subjects" ON st_subjects FOR ALL USING (true);
CREATE POLICY "Allow all on st_study_records" ON st_study_records FOR ALL USING (true);
CREATE POLICY "Allow all on st_weekly_goals" ON st_weekly_goals FOR ALL USING (true);
CREATE POLICY "Allow all on st_textbooks" ON st_textbooks FOR ALL USING (true);
