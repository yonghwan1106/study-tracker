import { supabase } from './supabase';
import { StudyRecord, Subject, WeeklyGoal, Textbook } from '@/types/database';
import { startOfWeek, endOfWeek, getISOWeek, getYear, format } from 'date-fns';

// Subjects
export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('st_subjects')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

// Study Records
export async function getStudyRecords(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudyRecord[]> {
  let query = supabase
    .from('st_study_records')
    .select('*, subject:subjects(*)')
    .eq('student_id', studentId)
    .order('study_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('study_date', startDate);
  }
  if (endDate) {
    query = query.lte('study_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getStudyRecordsByDate(
  studentId: string,
  date: string
): Promise<StudyRecord[]> {
  const { data, error } = await supabase
    .from('st_study_records')
    .select('*, subject:subjects(*)')
    .eq('student_id', studentId)
    .eq('study_date', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createStudyRecord(record: {
  student_id: string;
  subject_id: string;
  study_date: string;
  textbook?: string;
  study_range?: string;
  duration_minutes: number;
  memo?: string;
}): Promise<StudyRecord> {
  const { data, error } = await supabase
    .from('st_study_records')
    .insert(record)
    .select('*, subject:subjects(*)')
    .single();

  if (error) throw error;

  // Save textbook for autocomplete if provided
  if (record.textbook) {
    await saveTextbook(record.subject_id, record.textbook);
  }

  return data;
}

export async function updateStudyRecord(
  id: string,
  record: Partial<{
    subject_id: string;
    study_date: string;
    textbook: string;
    study_range: string;
    duration_minutes: number;
    memo: string;
  }>
): Promise<StudyRecord> {
  const { data, error } = await supabase
    .from('st_study_records')
    .update({ ...record, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, subject:subjects(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudyRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('st_study_records')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Weekly Goals
export async function getWeeklyGoals(
  studentId: string,
  year: number,
  weekNumber: number
): Promise<WeeklyGoal[]> {
  const { data, error } = await supabase
    .from('st_weekly_goals')
    .select('*, subject:subjects(*)')
    .eq('student_id', studentId)
    .eq('year', year)
    .eq('week_number', weekNumber);

  if (error) throw error;
  return data || [];
}

export async function setWeeklyGoal(goal: {
  student_id: string;
  subject_id: string;
  year: number;
  week_number: number;
  target_minutes: number;
}): Promise<WeeklyGoal> {
  const { data, error } = await supabase
    .from('st_weekly_goals')
    .upsert(goal, {
      onConflict: 'student_id,subject_id,year,week_number',
    })
    .select('*, subject:subjects(*)')
    .single();

  if (error) throw error;
  return data;
}

// Textbooks (autocomplete)
export async function getTextbooks(subjectId?: string): Promise<Textbook[]> {
  let query = supabase
    .from('st_textbooks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function saveTextbook(subjectId: string, name: string): Promise<void> {
  // Check if textbook already exists
  const { data: existing } = await supabase
    .from('st_textbooks')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('name', name)
    .single();

  if (!existing) {
    await supabase
      .from('st_textbooks')
      .insert({ subject_id: subjectId, name });
  }
}

// Statistics helpers
export async function getWeeklyStats(studentId: string, date: Date = new Date()) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  const records = await getStudyRecords(
    studentId,
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );

  const goals = await getWeeklyGoals(
    studentId,
    getYear(date),
    getISOWeek(date)
  );

  // Group by subject
  const subjectStats: Record<string, { total_minutes: number; records: StudyRecord[] }> = {};

  records.forEach((record) => {
    if (!record.subject) return;
    const subjectId = record.subject_id;
    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = { total_minutes: 0, records: [] };
    }
    subjectStats[subjectId].total_minutes += record.duration_minutes;
    subjectStats[subjectId].records.push(record);
  });

  return { records, goals, subjectStats, weekStart, weekEnd };
}

export async function getMonthlyStats(studentId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const records = await getStudyRecords(studentId, startDate, endDate);

  // Group by date
  const dailyStats: Record<string, { total_minutes: number; records: StudyRecord[] }> = {};

  records.forEach((record) => {
    const date = record.study_date;
    if (!dailyStats[date]) {
      dailyStats[date] = { total_minutes: 0, records: [] };
    }
    dailyStats[date].total_minutes += record.duration_minutes;
    dailyStats[date].records.push(record);
  });

  return { records, dailyStats };
}
