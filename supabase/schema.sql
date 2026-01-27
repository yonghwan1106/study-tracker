-- Study Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial student data
INSERT INTO students (name) VALUES ('박건호'), ('박도윤')
ON CONFLICT DO NOTHING;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- Initial subjects data
INSERT INTO subjects (name, category, color, sort_order) VALUES
  ('영어', 'english', '#3B82F6', 1),
  ('수학', 'math', '#EF4444', 2),
  ('국어', 'other', '#10B981', 3),
  ('사회', 'other', '#F59E0B', 4),
  ('과학', 'other', '#8B5CF6', 5),
  ('기타', 'other', '#6B7280', 6)
ON CONFLICT DO NOTHING;

-- Study records table
CREATE TABLE IF NOT EXISTS study_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  textbook TEXT,
  study_range TEXT,
  duration_minutes INT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly goals table
CREATE TABLE IF NOT EXISTS weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  year INT NOT NULL,
  week_number INT NOT NULL,
  target_minutes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, year, week_number)
);

-- Textbooks table (for autocomplete)
CREATE TABLE IF NOT EXISTS textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_study_records_student_date ON study_records(student_id, study_date);
CREATE INDEX IF NOT EXISTS idx_study_records_date ON study_records(study_date);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_student_week ON weekly_goals(student_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_textbooks_subject ON textbooks(subject_id);

-- Disable RLS for simplicity (no authentication)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbooks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (public access)
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations on subjects" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow all operations on study_records" ON study_records FOR ALL USING (true);
CREATE POLICY "Allow all operations on weekly_goals" ON weekly_goals FOR ALL USING (true);
CREATE POLICY "Allow all operations on textbooks" ON textbooks FOR ALL USING (true);
