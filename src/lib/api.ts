import { Student, StudyRecord, Subject, WeeklyGoal, Textbook } from '@/types/database';
import { startOfWeek, endOfWeek, getISOWeek, getYear, format } from 'date-fns';

interface StudyRecordPayload {
  student_id: string;
  subject_id: string;
  study_date: string;
  textbook?: string | null;
  study_range?: string | null;
  duration_minutes: number;
  memo?: string | null;
}

interface StudyRecordUpdatePayload {
  subject_id?: string;
  study_date?: string;
  textbook?: string | null;
  study_range?: string | null;
  duration_minutes?: number;
  memo?: string | null;
}

function buildUrl(path: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(path, {
    ...options,
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    let message = '요청 처리에 실패했습니다.';

    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Keep the default message when the response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Students
export async function getStudents(): Promise<Student[]> {
  return request<Student[]>('/api/students');
}

// Subjects
export async function getSubjects(): Promise<Subject[]> {
  return request<Subject[]>('/api/subjects');
}

// Study Records
export async function getStudyRecords(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudyRecord[]> {
  return request<StudyRecord[]>(
    buildUrl('/api/records', { studentId, startDate, endDate })
  );
}

export async function getStudyRecordsByDate(
  studentId: string,
  date: string
): Promise<StudyRecord[]> {
  return request<StudyRecord[]>(buildUrl('/api/records', { studentId, date }));
}

export async function getStudyRecord(id: string): Promise<StudyRecord> {
  return request<StudyRecord>(`/api/records/${id}`);
}

export async function createStudyRecord(record: StudyRecordPayload): Promise<StudyRecord> {
  return request<StudyRecord>('/api/records', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function updateStudyRecord(
  id: string,
  record: StudyRecordUpdatePayload
): Promise<StudyRecord> {
  return request<StudyRecord>(`/api/records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(record),
  });
}

export async function deleteStudyRecord(id: string): Promise<void> {
  await request<void>(`/api/records/${id}`, {
    method: 'DELETE',
  });
}

// Weekly Goals
export async function getWeeklyGoals(
  studentId: string,
  year: number,
  weekNumber: number
): Promise<WeeklyGoal[]> {
  return request<WeeklyGoal[]>(
    buildUrl('/api/goals', { studentId, year, weekNumber })
  );
}

export async function setWeeklyGoal(goal: {
  student_id: string;
  subject_id: string;
  year: number;
  week_number: number;
  target_minutes: number;
}): Promise<WeeklyGoal> {
  return request<WeeklyGoal>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(goal),
  });
}

// Textbooks (autocomplete)
export async function getTextbooks(subjectId?: string): Promise<Textbook[]> {
  return request<Textbook[]>(buildUrl('/api/textbooks', { subjectId }));
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
