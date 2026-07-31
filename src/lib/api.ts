import {
  CurriculumType,
  SchoolEvent,
  SchoolEventType,
  Student,
  StudyRecord,
  Subject,
  Textbook,
} from '@/types/database';
import { startOfWeek, endOfWeek, format } from 'date-fns';

type SubjectCategory = Subject['category'];

interface WeeklyStatsOptions {
  includeTextbooks?: boolean;
}

interface TextbookPayload {
  student_id: string;
  subject_id: string;
  name: string;
  cover_image_url?: string | null;
  curriculum_type?: CurriculumType;
  total_pages?: number;
  sections?: {
    name: string;
    total_pages: number;
    first_semester_target_page?: number | null;
  }[];
}

interface TextbookUpdatePayload {
  name?: string;
  cover_image_url?: string | null;
  curriculum_type?: CurriculumType;
  section_targets?: { id: string; first_semester_target_page?: number | null }[];
}

export interface AcademicSettings {
  current_semester: 1 | 2;
  updated_at: string;
}

interface StudyRecordPayload {
  student_id: string;
  textbook_id: string;
  textbook_section_id?: string;
  study_date: string;
  start_page?: number | null;
  end_page: number;
  duration_minutes?: number | null;
  memo?: string | null;
}

interface StudyRecordUpdatePayload {
  textbook_id?: string;
  textbook_section_id?: string;
  study_date?: string;
  start_page?: number | null;
  end_page?: number;
  duration_minutes?: number | null;
  memo?: string | null;
}

interface SchoolEventPayload {
  student_id: string;
  subject_id?: string | null;
  event_type: SchoolEventType;
  title: string;
  start_date: string;
  end_date?: string;
  start_time?: string | null;
  memo?: string | null;
}

interface SchoolEventUpdatePayload {
  subject_id?: string | null;
  event_type?: SchoolEventType;
  title?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string | null;
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

export async function getStudents(): Promise<Student[]> {
  return request<Student[]>('/api/students');
}

export async function getSubjects(): Promise<Subject[]> {
  return request<Subject[]>('/api/subjects');
}

export async function getTextbooks(
  studentId: string,
  subjectId?: string,
  subjectCategories?: SubjectCategory[]
): Promise<Textbook[]> {
  return request<Textbook[]>(
    buildUrl('/api/textbooks', {
      studentId,
      subjectId,
      subjectCategories: subjectCategories?.join(','),
    })
  );
}

export async function createTextbook(textbook: TextbookPayload): Promise<Textbook> {
  return request<Textbook>('/api/textbooks', {
    method: 'POST',
    body: JSON.stringify(textbook),
  });
}

export async function updateTextbook(
  id: string,
  textbook: TextbookUpdatePayload
): Promise<Textbook> {
  return request<Textbook>(`/api/textbooks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(textbook),
  });
}

export async function getAcademicSettings(): Promise<AcademicSettings> {
  return request<AcademicSettings>('/api/academic-settings');
}

export async function updateAcademicSettings(
  currentSemester: 1 | 2
): Promise<AcademicSettings> {
  return request<AcademicSettings>('/api/academic-settings', {
    method: 'PATCH',
    body: JSON.stringify({ current_semester: currentSemester }),
  });
}

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

export async function getSchoolEvents(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<SchoolEvent[]> {
  return request<SchoolEvent[]>(
    buildUrl('/api/events', { studentId, startDate, endDate })
  );
}

export async function getUpcomingSchoolEvents(
  studentId: string,
  fromDate: string,
  limit = 5
): Promise<SchoolEvent[]> {
  return request<SchoolEvent[]>(
    buildUrl('/api/events', { studentId, fromDate, limit })
  );
}

export async function createSchoolEvent(event: SchoolEventPayload): Promise<SchoolEvent> {
  return request<SchoolEvent>('/api/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateSchoolEvent(
  id: string,
  event: SchoolEventUpdatePayload
): Promise<SchoolEvent> {
  return request<SchoolEvent>(`/api/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(event),
  });
}

export async function deleteSchoolEvent(id: string): Promise<void> {
  await request<void>(`/api/events/${id}`, {
    method: 'DELETE',
  });
}

export function getPagesDone(record: StudyRecord): number {
  if (record.pages_done !== null && record.pages_done !== undefined) {
    return record.pages_done;
  }

  if (record.start_page !== null && record.start_page !== undefined) {
    return Math.max(0, record.end_page - record.start_page + 1);
  }

  return 0;
}

export async function getWeeklyStats(
  studentId: string,
  date: Date = new Date(),
  options: WeeklyStatsOptions = {}
) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  const recordsPromise = getStudyRecords(
    studentId,
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );
  const textbooksPromise = options.includeTextbooks === false
    ? Promise.resolve<Textbook[]>([])
    : getTextbooks(studentId);

  const [records, textbooks] = await Promise.all([recordsPromise, textbooksPromise]);

  const subjectStats: Record<string, { total_pages: number; records: StudyRecord[] }> = {};

  records.forEach((record) => {
    if (!record.subject) return;
    const subjectId = record.subject_id;
    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = { total_pages: 0, records: [] };
    }
    subjectStats[subjectId].total_pages += getPagesDone(record);
    subjectStats[subjectId].records.push(record);
  });

  return { records, textbooks, subjectStats, weekStart, weekEnd };
}

export async function getMonthlyStats(studentId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const records = await getStudyRecords(studentId, startDate, endDate);
  const dailyStats: Record<string, { total_pages: number; records: StudyRecord[] }> = {};

  records.forEach((record) => {
    const date = record.study_date;
    if (!dailyStats[date]) {
      dailyStats[date] = { total_pages: 0, records: [] };
    }
    dailyStats[date].total_pages += getPagesDone(record);
    dailyStats[date].records.push(record);
  });

  return { records, dailyStats };
}
