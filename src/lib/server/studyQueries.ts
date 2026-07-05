import { getSql } from '@/lib/db';
import { Student, StudyRecord, Subject, Textbook, WeeklyGoal } from '@/types/database';

export interface StudyRecordInput {
  student_id: string;
  subject_id: string;
  study_date: string;
  textbook?: string | null;
  study_range?: string | null;
  duration_minutes: number;
  memo?: string | null;
}

export interface StudyRecordUpdateInput {
  subject_id?: string;
  study_date?: string;
  textbook?: string | null;
  study_range?: string | null;
  duration_minutes?: number;
  memo?: string | null;
}

export interface WeeklyGoalInput {
  student_id: string;
  subject_id: string;
  year: number;
  week_number: number;
  target_minutes: number;
}

const hasOwn = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

function nullableText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
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
    ORDER BY sort_order
  `;

  return rows as unknown as Subject[];
}

export async function getStudyRecords(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudyRecord[]> {
  const sql = getSql();

  if (startDate && endDate) {
    const rows = await sql`
      SELECT
        r.id::text,
        r.student_id::text,
        r.subject_id::text,
        to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
        r.textbook,
        r.study_range,
        r.duration_minutes,
        r.memo,
        r.created_at::text,
        r.updated_at::text,
        CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
          'id', s.id::text,
          'name', s.name,
          'category', s.category,
          'color', s.color,
          'sort_order', s.sort_order
        ) END AS subject
      FROM st_study_records r
      LEFT JOIN st_subjects s ON s.id = r.subject_id
      WHERE r.student_id = ${studentId}
        AND r.study_date >= ${startDate}::date
        AND r.study_date <= ${endDate}::date
      ORDER BY r.study_date DESC, r.created_at DESC
    `;

    return rows as unknown as StudyRecord[];
  }

  if (startDate) {
    const rows = await sql`
      SELECT
        r.id::text,
        r.student_id::text,
        r.subject_id::text,
        to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
        r.textbook,
        r.study_range,
        r.duration_minutes,
        r.memo,
        r.created_at::text,
        r.updated_at::text,
        CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
          'id', s.id::text,
          'name', s.name,
          'category', s.category,
          'color', s.color,
          'sort_order', s.sort_order
        ) END AS subject
      FROM st_study_records r
      LEFT JOIN st_subjects s ON s.id = r.subject_id
      WHERE r.student_id = ${studentId}
        AND r.study_date >= ${startDate}::date
      ORDER BY r.study_date DESC, r.created_at DESC
    `;

    return rows as unknown as StudyRecord[];
  }

  if (endDate) {
    const rows = await sql`
      SELECT
        r.id::text,
        r.student_id::text,
        r.subject_id::text,
        to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
        r.textbook,
        r.study_range,
        r.duration_minutes,
        r.memo,
        r.created_at::text,
        r.updated_at::text,
        CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
          'id', s.id::text,
          'name', s.name,
          'category', s.category,
          'color', s.color,
          'sort_order', s.sort_order
        ) END AS subject
      FROM st_study_records r
      LEFT JOIN st_subjects s ON s.id = r.subject_id
      WHERE r.student_id = ${studentId}
        AND r.study_date <= ${endDate}::date
      ORDER BY r.study_date DESC, r.created_at DESC
    `;

    return rows as unknown as StudyRecord[];
  }

  const rows = await sql`
    SELECT
      r.id::text,
      r.student_id::text,
      r.subject_id::text,
      to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
      r.textbook,
      r.study_range,
      r.duration_minutes,
      r.memo,
      r.created_at::text,
      r.updated_at::text,
      CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) END AS subject
    FROM st_study_records r
    LEFT JOIN st_subjects s ON s.id = r.subject_id
    WHERE r.student_id = ${studentId}
    ORDER BY r.study_date DESC, r.created_at DESC
  `;

  return rows as unknown as StudyRecord[];
}

export async function getStudyRecordsByDate(
  studentId: string,
  date: string
): Promise<StudyRecord[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      r.id::text,
      r.student_id::text,
      r.subject_id::text,
      to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
      r.textbook,
      r.study_range,
      r.duration_minutes,
      r.memo,
      r.created_at::text,
      r.updated_at::text,
      CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) END AS subject
    FROM st_study_records r
    LEFT JOIN st_subjects s ON s.id = r.subject_id
    WHERE r.student_id = ${studentId}
      AND r.study_date = ${date}::date
    ORDER BY r.created_at DESC
  `;

  return rows as unknown as StudyRecord[];
}

export async function getStudyRecord(id: string): Promise<StudyRecord | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      r.id::text,
      r.student_id::text,
      r.subject_id::text,
      to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
      r.textbook,
      r.study_range,
      r.duration_minutes,
      r.memo,
      r.created_at::text,
      r.updated_at::text,
      CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) END AS subject
    FROM st_study_records r
    LEFT JOIN st_subjects s ON s.id = r.subject_id
    WHERE r.id = ${id}
    LIMIT 1
  `;

  const records = rows as unknown as StudyRecord[];
  return records[0] ?? null;
}

export async function createStudyRecord(record: StudyRecordInput): Promise<StudyRecord> {
  const sql = getSql();
  const textbook = nullableText(record.textbook);
  const studyRange = nullableText(record.study_range);
  const memo = nullableText(record.memo);

  const rows = await sql`
    WITH inserted AS (
      INSERT INTO st_study_records (
        student_id,
        subject_id,
        study_date,
        textbook,
        study_range,
        duration_minutes,
        memo
      )
      VALUES (
        ${record.student_id},
        ${record.subject_id},
        ${record.study_date}::date,
        ${textbook},
        ${studyRange},
        ${record.duration_minutes},
        ${memo}
      )
      RETURNING *
    )
    SELECT
      r.id::text,
      r.student_id::text,
      r.subject_id::text,
      to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
      r.textbook,
      r.study_range,
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
      ) AS subject
    FROM inserted r
    JOIN st_subjects s ON s.id = r.subject_id
  `;

  if (textbook) {
    await saveTextbook(record.subject_id, textbook);
  }

  return (rows as unknown as StudyRecord[])[0];
}

export async function updateStudyRecord(
  id: string,
  record: StudyRecordUpdateInput
): Promise<StudyRecord> {
  const current = await getStudyRecord(id);

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  const next = {
    subject_id: record.subject_id ?? current.subject_id,
    study_date: record.study_date ?? current.study_date,
    textbook: hasOwn(record, 'textbook') ? nullableText(record.textbook) : current.textbook,
    study_range: hasOwn(record, 'study_range') ? nullableText(record.study_range) : current.study_range,
    duration_minutes: record.duration_minutes ?? current.duration_minutes,
    memo: hasOwn(record, 'memo') ? nullableText(record.memo) : current.memo,
  };

  const sql = getSql();
  const rows = await sql`
    WITH updated AS (
      UPDATE st_study_records
      SET
        subject_id = ${next.subject_id},
        study_date = ${next.study_date}::date,
        textbook = ${next.textbook},
        study_range = ${next.study_range},
        duration_minutes = ${next.duration_minutes},
        memo = ${next.memo},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    )
    SELECT
      r.id::text,
      r.student_id::text,
      r.subject_id::text,
      to_char(r.study_date, 'YYYY-MM-DD') AS study_date,
      r.textbook,
      r.study_range,
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
      ) AS subject
    FROM updated r
    JOIN st_subjects s ON s.id = r.subject_id
  `;

  const records = rows as unknown as StudyRecord[];

  if (!records[0]) {
    throw new Error('NOT_FOUND');
  }

  if (next.textbook) {
    await saveTextbook(next.subject_id, next.textbook);
  }

  return records[0];
}

export async function deleteStudyRecord(id: string): Promise<void> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM st_study_records
    WHERE id = ${id}
    RETURNING id
  `;

  if (!(rows as unknown as { id: string }[])[0]) {
    throw new Error('NOT_FOUND');
  }
}

export async function getWeeklyGoals(
  studentId: string,
  year: number,
  weekNumber: number
): Promise<WeeklyGoal[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      g.id::text,
      g.student_id::text,
      g.subject_id::text,
      g.year,
      g.week_number,
      g.target_minutes,
      g.created_at::text,
      CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) END AS subject
    FROM st_weekly_goals g
    LEFT JOIN st_subjects s ON s.id = g.subject_id
    WHERE g.student_id = ${studentId}
      AND g.year = ${year}
      AND g.week_number = ${weekNumber}
  `;

  return rows as unknown as WeeklyGoal[];
}

export async function setWeeklyGoal(goal: WeeklyGoalInput): Promise<WeeklyGoal> {
  const sql = getSql();
  const rows = await sql`
    WITH upserted AS (
      INSERT INTO st_weekly_goals (
        student_id,
        subject_id,
        year,
        week_number,
        target_minutes
      )
      VALUES (
        ${goal.student_id},
        ${goal.subject_id},
        ${goal.year},
        ${goal.week_number},
        ${goal.target_minutes}
      )
      ON CONFLICT (student_id, subject_id, year, week_number)
      DO UPDATE SET target_minutes = EXCLUDED.target_minutes
      RETURNING *
    )
    SELECT
      g.id::text,
      g.student_id::text,
      g.subject_id::text,
      g.year,
      g.week_number,
      g.target_minutes,
      g.created_at::text,
      json_build_object(
        'id', s.id::text,
        'name', s.name,
        'category', s.category,
        'color', s.color,
        'sort_order', s.sort_order
      ) AS subject
    FROM upserted g
    JOIN st_subjects s ON s.id = g.subject_id
  `;

  return (rows as unknown as WeeklyGoal[])[0];
}

export async function getTextbooks(subjectId?: string): Promise<Textbook[]> {
  const sql = getSql();

  if (subjectId) {
    const rows = await sql`
      SELECT id::text, subject_id::text, name, created_at::text
      FROM st_textbooks
      WHERE subject_id = ${subjectId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return rows as unknown as Textbook[];
  }

  const rows = await sql`
    SELECT id::text, subject_id::text, name, created_at::text
    FROM st_textbooks
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return rows as unknown as Textbook[];
}

async function saveTextbook(subjectId: string, name: string): Promise<void> {
  const textbook = nullableText(name);

  if (!textbook) {
    return;
  }

  const sql = getSql();
  await sql`
    INSERT INTO st_textbooks (subject_id, name)
    VALUES (${subjectId}, ${textbook})
    ON CONFLICT (subject_id, name) DO NOTHING
  `;
}
