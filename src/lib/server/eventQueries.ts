import { getSql } from '@/lib/db';
import { SchoolEvent, SchoolEventType } from '@/types/database';

const eventTypes: SchoolEventType[] = ['midterm', 'final', 'performance', 'school', 'other'];

export interface SchoolEventInput {
  student_id: string;
  subject_id?: string | null;
  event_type: SchoolEventType;
  title: string;
  start_date: string;
  end_date?: string;
  start_time?: string | null;
  memo?: string | null;
}

export interface SchoolEventUpdateInput {
  subject_id?: string | null;
  event_type?: SchoolEventType;
  title?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string | null;
  memo?: string | null;
}

const hasOwn = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

function nullableText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function badRequest(message: string): never {
  throw new Error(`BAD_REQUEST:${message}`);
}

function normalizeSubjectId(value: string | null | undefined) {
  const id = nullableText(value);
  return id && id !== 'none' ? id : null;
}

function validateDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    badRequest(`${label} 형식이 올바르지 않습니다.`);
  }
}

function validateTime(value: string | null) {
  if (value !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    badRequest('시간 형식이 올바르지 않습니다.');
  }
}

function validateType(value: SchoolEventType) {
  if (!eventTypes.includes(value)) {
    badRequest('일정 종류가 올바르지 않습니다.');
  }
}

function validateRange(startDate: string, endDate: string) {
  validateDate(startDate, '시작일');
  validateDate(endDate, '종료일');

  if (endDate < startDate) {
    badRequest('종료일은 시작일보다 빠를 수 없습니다.');
  }
}

function eventSelect() {
  return `
    e.id::text,
    e.student_id::text,
    e.subject_id::text,
    e.event_type,
    e.title,
    to_char(e.start_date, 'YYYY-MM-DD') AS start_date,
    to_char(e.end_date, 'YYYY-MM-DD') AS end_date,
    CASE WHEN e.start_time IS NULL THEN NULL ELSE to_char(e.start_time, 'HH24:MI') END AS start_time,
    e.memo,
    e.created_at::text,
    e.updated_at::text,
    CASE
      WHEN s.id IS NULL THEN NULL
      ELSE json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      )
    END AS subject
  `;
}

export async function getSchoolEvents(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<SchoolEvent[]> {
  const sql = getSql();
  const rows = await sql.query(`
    SELECT ${eventSelect()}
    FROM st_school_events e
    LEFT JOIN st_subjects s ON s.id = e.subject_id
    WHERE e.student_id = $1
      AND ($2::date IS NULL OR e.end_date >= $2::date)
      AND ($3::date IS NULL OR e.start_date <= $3::date)
    ORDER BY e.start_date, e.start_time NULLS FIRST, e.created_at
  `, [studentId, startDate ?? null, endDate ?? null]);

  return rows as unknown as SchoolEvent[];
}

export async function getUpcomingSchoolEvents(
  studentId: string,
  fromDate: string,
  limit = 5
): Promise<SchoolEvent[]> {
  const sql = getSql();
  const rows = await sql.query(`
    SELECT ${eventSelect()}
    FROM st_school_events e
    LEFT JOIN st_subjects s ON s.id = e.subject_id
    WHERE e.student_id = $1
      AND e.end_date >= $2::date
    ORDER BY e.start_date, e.start_time NULLS FIRST, e.created_at
    LIMIT $3
  `, [studentId, fromDate, limit]);

  return rows as unknown as SchoolEvent[];
}

export async function getSchoolEvent(id: string): Promise<SchoolEvent | null> {
  const sql = getSql();
  const rows = await sql.query(`
    SELECT ${eventSelect()}
    FROM st_school_events e
    LEFT JOIN st_subjects s ON s.id = e.subject_id
    WHERE e.id = $1
    LIMIT 1
  `, [id]);

  return (rows as unknown as SchoolEvent[])[0] ?? null;
}

export async function createSchoolEvent(input: SchoolEventInput): Promise<SchoolEvent> {
  const title = nullableText(input.title);
  const startDate = input.start_date;
  const endDate = input.end_date || input.start_date;
  const startTime = nullableText(input.start_time);

  if (!title) {
    badRequest('일정 제목을 입력해주세요.');
  }

  validateType(input.event_type);
  validateRange(startDate, endDate);
  validateTime(startTime);

  const sql = getSql();
  const rows = await sql`
    INSERT INTO st_school_events (
      student_id,
      subject_id,
      event_type,
      title,
      start_date,
      end_date,
      start_time,
      memo
    )
    VALUES (
      ${input.student_id},
      ${normalizeSubjectId(input.subject_id)},
      ${input.event_type},
      ${title},
      ${startDate}::date,
      ${endDate}::date,
      ${startTime},
      ${nullableText(input.memo)}
    )
    RETURNING id::text
  `;

  const created = await getSchoolEvent((rows as unknown as { id: string }[])[0].id);
  if (!created) throw new Error('NOT_FOUND');

  return created;
}

export async function updateSchoolEvent(
  id: string,
  input: SchoolEventUpdateInput
): Promise<SchoolEvent> {
  const current = await getSchoolEvent(id);

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  const next = {
    subject_id: hasOwn(input, 'subject_id')
      ? normalizeSubjectId(input.subject_id)
      : current.subject_id,
    event_type: input.event_type ?? current.event_type,
    title: hasOwn(input, 'title') ? nullableText(input.title) : current.title,
    start_date: input.start_date ?? current.start_date,
    end_date: input.end_date ?? current.end_date,
    start_time: hasOwn(input, 'start_time') ? nullableText(input.start_time) : current.start_time,
    memo: hasOwn(input, 'memo') ? nullableText(input.memo) : current.memo,
  };

  if (!next.title) {
    badRequest('일정 제목을 입력해주세요.');
  }

  validateType(next.event_type);
  validateRange(next.start_date, next.end_date);
  validateTime(next.start_time);

  const sql = getSql();
  await sql`
    UPDATE st_school_events
    SET
      subject_id = ${next.subject_id},
      event_type = ${next.event_type},
      title = ${next.title},
      start_date = ${next.start_date}::date,
      end_date = ${next.end_date}::date,
      start_time = ${next.start_time},
      memo = ${next.memo},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const updated = await getSchoolEvent(id);
  if (!updated) throw new Error('NOT_FOUND');

  return updated;
}

export async function deleteSchoolEvent(id: string): Promise<void> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM st_school_events
    WHERE id = ${id}
    RETURNING id::text
  `;

  if (!(rows as unknown as { id: string }[])[0]) {
    throw new Error('NOT_FOUND');
  }
}
