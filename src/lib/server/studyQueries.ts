import { getSql } from '@/lib/db';
import { Student, StudyRecord, Subject, Textbook } from '@/types/database';

export interface TextbookInput {
  student_id: string;
  subject_id: string;
  name: string;
  total_pages: number;
}

export interface StudyRecordInput {
  student_id: string;
  textbook_id: string;
  study_date: string;
  start_page?: number | null;
  end_page: number;
  duration_minutes?: number | null;
  memo?: string | null;
}

export interface StudyRecordUpdateInput {
  textbook_id?: string;
  study_date?: string;
  start_page?: number | null;
  end_page?: number;
  duration_minutes?: number | null;
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

function progressPercent(currentPage: number, totalPages: number) {
  if (totalPages <= 0) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 1000) / 10);
}

function normalizeTextbook(row: Textbook): Textbook {
  return {
    ...row,
    progress_percent: progressPercent(row.current_page, row.total_pages),
    is_completed: row.current_page >= row.total_pages,
  };
}

function validatePages(startPage: number | null | undefined, endPage: number, totalPages: number) {
  if (!Number.isFinite(endPage) || endPage <= 0) {
    badRequest('완료 페이지는 1 이상이어야 합니다.');
  }

  if (endPage > totalPages) {
    badRequest(`완료 페이지는 총 ${totalPages}페이지를 넘을 수 없습니다.`);
  }

  if (startPage !== null && startPage !== undefined) {
    if (!Number.isFinite(startPage) || startPage < 0) {
      badRequest('시작 페이지는 0 이상이어야 합니다.');
    }

    if (startPage > endPage) {
      badRequest('시작 페이지는 완료 페이지보다 클 수 없습니다.');
    }
  }
}

export async function getStudents(): Promise<Student[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id::text, name, created_at::text
    FROM st_students
    ORDER BY name
  `;

  return rows as unknown as Student[];
}

export async function getSubjects(): Promise<Subject[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id::text, name, category, color, sort_order
    FROM st_subjects
    WHERE name IN ('국어', '영어', '수학', '과학', '사회')
    ORDER BY sort_order
  `;

  return rows as unknown as Subject[];
}

export async function getTextbook(id: string): Promise<Textbook | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      t.id::text,
      t.student_id::text,
      t.subject_id::text,
      t.name,
      t.total_pages,
      t.current_page,
      ROUND((t.current_page::numeric / NULLIF(t.total_pages, 0)) * 100, 1)::float AS progress_percent,
      (t.current_page >= t.total_pages) AS is_completed,
      t.created_at::text,
      t.updated_at::text,
      json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) AS subject
    FROM st_textbooks t
    JOIN st_subjects s ON s.id = t.subject_id
    WHERE t.id = ${id}
    LIMIT 1
  `;

  const textbooks = rows as unknown as Textbook[];
  return textbooks[0] ? normalizeTextbook(textbooks[0]) : null;
}

export async function getTextbooks(studentId: string, subjectId?: string): Promise<Textbook[]> {
  const sql = getSql();
  const subjectFilter = subjectId ?? null;
  const rows = await sql`
    SELECT
      t.id::text,
      t.student_id::text,
      t.subject_id::text,
      t.name,
      t.total_pages,
      t.current_page,
      ROUND((t.current_page::numeric / NULLIF(t.total_pages, 0)) * 100, 1)::float AS progress_percent,
      (t.current_page >= t.total_pages) AS is_completed,
      t.created_at::text,
      t.updated_at::text,
      json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) AS subject
    FROM st_textbooks t
    JOIN st_subjects s ON s.id = t.subject_id
    WHERE t.student_id = ${studentId}
      AND (${subjectFilter}::uuid IS NULL OR t.subject_id = ${subjectFilter}::uuid)
    ORDER BY s.sort_order, (t.current_page >= t.total_pages), t.name
  `;

  return (rows as unknown as Textbook[]).map(normalizeTextbook);
}

export async function createTextbook(textbook: TextbookInput): Promise<Textbook> {
  const name = nullableText(textbook.name);

  if (!name) {
    badRequest('교재명을 입력해주세요.');
  }

  if (!Number.isFinite(textbook.total_pages) || textbook.total_pages <= 0) {
    badRequest('총 페이지는 1 이상이어야 합니다.');
  }

  const sql = getSql();
  const rows = await sql`
    WITH upserted AS (
      INSERT INTO st_textbooks (
        student_id,
        subject_id,
        name,
        total_pages
      )
      VALUES (
        ${textbook.student_id},
        ${textbook.subject_id},
        ${name},
        ${textbook.total_pages}
      )
      ON CONFLICT (student_id, subject_id, name)
      DO UPDATE SET
        total_pages = EXCLUDED.total_pages,
        current_page = LEAST(st_textbooks.current_page, EXCLUDED.total_pages),
        updated_at = NOW()
      RETURNING *
    )
    SELECT
      t.id::text,
      t.student_id::text,
      t.subject_id::text,
      t.name,
      t.total_pages,
      t.current_page,
      ROUND((t.current_page::numeric / NULLIF(t.total_pages, 0)) * 100, 1)::float AS progress_percent,
      (t.current_page >= t.total_pages) AS is_completed,
      t.created_at::text,
      t.updated_at::text,
      json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) AS subject
    FROM upserted t
    JOIN st_subjects s ON s.id = t.subject_id
  `;

  return normalizeTextbook((rows as unknown as Textbook[])[0]);
}

async function recalculateTextbookProgress(textbookId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE st_textbooks t
    SET
      current_page = LEAST(
        t.total_pages,
        COALESCE((
          SELECT MAX(r.end_page)
          FROM st_study_records r
          WHERE r.textbook_id = t.id
        ), 0)
      ),
      updated_at = NOW()
    WHERE t.id = ${textbookId}
  `;
}

export async function getStudyRecords(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudyRecord[]> {
  const sql = getSql();
  const start = startDate ?? null;
  const end = endDate ?? null;
  const rows = await sql`
    SELECT
      r.id::text,
      r.student_id::text,
      r.textbook_id::text,
      r.subject_id::text,
      to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
      r.start_page,
      r.end_page,
      CASE
        WHEN r.start_page IS NULL THEN NULL
        ELSE GREATEST(r.end_page - r.start_page + 1, 0)
      END AS pages_done,
      r.duration_minutes,
      r.memo,
      r.created_at::text,
      r.updated_at::text,
      json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) AS subject,
      json_build_object(
        'id', t.id::text,
        'student_id', t.student_id::text,
        'subject_id', t.subject_id::text,
        'name', t.name,
        'total_pages', t.total_pages,
        'current_page', t.current_page,
        'progress_percent', ROUND((t.current_page::numeric / NULLIF(t.total_pages, 0)) * 100, 1)::float,
        'is_completed', (t.current_page >= t.total_pages),
        'created_at', t.created_at::text,
        'updated_at', t.updated_at::text
      ) AS textbook
    FROM st_study_records r
    JOIN st_textbooks t ON t.id = r.textbook_id
    JOIN st_subjects s ON s.id = r.subject_id
    WHERE r.student_id = ${studentId}
      AND (${start}::date IS NULL OR r.study_date >= ${start}::date)
      AND (${end}::date IS NULL OR r.study_date <= ${end}::date)
    ORDER BY r.study_date DESC, r.created_at DESC
  `;

  return rows as unknown as StudyRecord[];
}

export async function getStudyRecordsByDate(
  studentId: string,
  date: string
): Promise<StudyRecord[]> {
  return getStudyRecords(studentId, date, date);
}

export async function getStudyRecord(id: string): Promise<StudyRecord | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      r.id::text,
      r.student_id::text,
      r.textbook_id::text,
      r.subject_id::text,
      to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
      r.start_page,
      r.end_page,
      CASE
        WHEN r.start_page IS NULL THEN NULL
        ELSE GREATEST(r.end_page - r.start_page + 1, 0)
      END AS pages_done,
      r.duration_minutes,
      r.memo,
      r.created_at::text,
      r.updated_at::text,
      json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) AS subject,
      json_build_object(
        'id', t.id::text,
        'student_id', t.student_id::text,
        'subject_id', t.subject_id::text,
        'name', t.name,
        'total_pages', t.total_pages,
        'current_page', t.current_page,
        'progress_percent', ROUND((t.current_page::numeric / NULLIF(t.total_pages, 0)) * 100, 1)::float,
        'is_completed', (t.current_page >= t.total_pages),
        'created_at', t.created_at::text,
        'updated_at', t.updated_at::text
      ) AS textbook
    FROM st_study_records r
    JOIN st_textbooks t ON t.id = r.textbook_id
    JOIN st_subjects s ON s.id = r.subject_id
    WHERE r.id = ${id}
    LIMIT 1
  `;

  const records = rows as unknown as StudyRecord[];
  return records[0] ?? null;
}

export async function createStudyRecord(record: StudyRecordInput): Promise<StudyRecord> {
  const textbook = await getTextbook(record.textbook_id);

  if (!textbook || textbook.student_id !== record.student_id) {
    throw new Error('NOT_FOUND');
  }

  validatePages(record.start_page, record.end_page, textbook.total_pages);

  const sql = getSql();
  const rows = await sql`
    INSERT INTO st_study_records (
      student_id,
      textbook_id,
      subject_id,
      study_date,
      start_page,
      end_page,
      duration_minutes,
      memo
    )
    VALUES (
      ${record.student_id},
      ${record.textbook_id},
      ${textbook.subject_id},
      ${record.study_date}::date,
      ${record.start_page ?? null},
      ${record.end_page},
      ${record.duration_minutes ?? null},
      ${nullableText(record.memo)}
    )
    RETURNING id::text
  `;

  await recalculateTextbookProgress(record.textbook_id);

  const created = await getStudyRecord((rows as unknown as { id: string }[])[0].id);
  if (!created) throw new Error('NOT_FOUND');

  return created;
}

export async function updateStudyRecord(
  id: string,
  record: StudyRecordUpdateInput
): Promise<StudyRecord> {
  const current = await getStudyRecord(id);

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  const nextTextbookId = record.textbook_id ?? current.textbook_id;
  const textbook = await getTextbook(nextTextbookId);

  if (!textbook || textbook.student_id !== current.student_id) {
    throw new Error('NOT_FOUND');
  }

  const next = {
    textbook_id: nextTextbookId,
    subject_id: textbook.subject_id,
    study_date: record.study_date ?? current.study_date,
    start_page: hasOwn(record, 'start_page') ? record.start_page ?? null : current.start_page,
    end_page: record.end_page ?? current.end_page,
    duration_minutes: hasOwn(record, 'duration_minutes')
      ? record.duration_minutes ?? null
      : current.duration_minutes,
    memo: hasOwn(record, 'memo') ? nullableText(record.memo) : current.memo,
  };

  validatePages(next.start_page, next.end_page, textbook.total_pages);

  const sql = getSql();
  await sql`
    UPDATE st_study_records
    SET
      textbook_id = ${next.textbook_id},
      subject_id = ${next.subject_id},
      study_date = ${next.study_date}::date,
      start_page = ${next.start_page},
      end_page = ${next.end_page},
      duration_minutes = ${next.duration_minutes},
      memo = ${next.memo},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  await recalculateTextbookProgress(current.textbook_id);
  if (current.textbook_id !== next.textbook_id) {
    await recalculateTextbookProgress(next.textbook_id);
  }

  const updated = await getStudyRecord(id);
  if (!updated) throw new Error('NOT_FOUND');

  return updated;
}

export async function deleteStudyRecord(id: string): Promise<void> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM st_study_records
    WHERE id = ${id}
    RETURNING textbook_id::text
  `;

  const deleted = (rows as unknown as { textbook_id: string }[])[0];
  if (!deleted) {
    throw new Error('NOT_FOUND');
  }

  await recalculateTextbookProgress(deleted.textbook_id);
}
