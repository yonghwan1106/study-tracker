import { getSql } from '@/lib/db';
import { getSchoolProgress } from '@/lib/textbookProgress';
import { getAcademicSettings } from '@/lib/server/academicSettings';
import {
  CurriculumType,
  Student,
  StudyRecord,
  Subject,
  Textbook,
  TextbookSection,
} from '@/types/database';

type SubjectCategory = Subject['category'];

export interface TextbookSectionInput {
  name: string;
  total_pages: number;
  first_semester_target_page?: number | null;
}

export interface TextbookInput {
  student_id: string;
  subject_id: string;
  name: string;
  cover_image_url?: string | null;
  curriculum_type?: CurriculumType;
  total_pages?: number;
  sections?: TextbookSectionInput[];
}

export interface TextbookUpdateInput {
  name?: string;
  cover_image_url?: string | null;
  curriculum_type?: CurriculumType;
  section_targets?: { id: string; first_semester_target_page?: number | null }[];
}

export interface StudyRecordInput {
  student_id: string;
  textbook_id: string;
  textbook_section_id?: string;
  study_date: string;
  start_page?: number | null;
  end_page: number;
  duration_minutes?: number | null;
  memo?: string | null;
}

export interface StudyRecordUpdateInput {
  textbook_id?: string;
  textbook_section_id?: string;
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

function validateCoverImage(value: string | null) {
  if (!value) return;

  if (!value.startsWith('data:image/')) {
    badRequest('표지 이미지는 이미지 파일만 사용할 수 있습니다.');
  }

  if (value.length > 900_000) {
    badRequest('표지 이미지가 너무 큽니다. 조금 더 작은 사진을 사용해주세요.');
  }
}

function badRequest(message: string): never {
  throw new Error(`BAD_REQUEST:${message}`);
}

function progressPercent(currentPage: number, totalPages: number) {
  if (totalPages <= 0) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 1000) / 10);
}

function normalizeCurriculumType(value: CurriculumType | undefined): CurriculumType {
  if (!value) return 'semester';
  if (value === 'semester' || value === 'year') return value;
  badRequest('교재 기간은 한 학기용 또는 1년용으로 선택해주세요.');
}

function normalizeSection(row: TextbookSection): TextbookSection {
  return {
    ...row,
    progress_percent: progressPercent(row.current_page, row.total_pages),
    is_completed: row.current_page >= row.total_pages,
  };
}

function normalizeTextbook(row: Textbook, currentSemester: 1 | 2 = 1): Textbook {
  const normalized = {
    ...row,
    progress_percent: progressPercent(row.current_page, row.total_pages),
    is_completed: row.current_page >= row.total_pages,
    sections: row.sections?.map(normalizeSection) ?? [],
  };

  return {
    ...normalized,
    curriculum_type: row.curriculum_type ?? 'semester',
    school_progress: getSchoolProgress(normalized, currentSemester),
  };
}

function normalizeSections(
  input: TextbookInput,
  curriculumType: CurriculumType
): TextbookSectionInput[] {
  const provided = input.sections?.filter((section) => nullableText(section.name));

  if (provided && provided.length > 0) {
    return provided.map((section) => ({
      name: nullableText(section.name) ?? '본책',
      total_pages: section.total_pages,
      first_semester_target_page: curriculumType === 'year'
        ? section.first_semester_target_page ?? Math.ceil(section.total_pages / 2)
        : null,
    }));
  }

  if (input.total_pages && input.total_pages > 0) {
    return [{
      name: '본책',
      total_pages: input.total_pages,
      first_semester_target_page: curriculumType === 'year'
        ? Math.ceil(input.total_pages / 2)
        : null,
    }];
  }

  badRequest('교재 구성을 1개 이상 입력해주세요.');
}

function validateSections(sections: TextbookSectionInput[], curriculumType: CurriculumType) {
  const names = new Set<string>();

  sections.forEach((section) => {
    const name = nullableText(section.name);

    if (!name) {
      badRequest('구성명을 입력해주세요.');
    }

    if (names.has(name)) {
      badRequest(`구성명 "${name}"이 중복되었습니다.`);
    }

    if (!Number.isFinite(section.total_pages) || section.total_pages <= 0) {
      badRequest(`${name}의 총 페이지는 1 이상이어야 합니다.`);
    }

    if (curriculumType === 'year') {
      const target = section.first_semester_target_page;
      if (
        !Number.isInteger(target)
        || target === undefined
        || target === null
        || target < 0
        || target > section.total_pages
      ) {
        badRequest(`${name}의 1학기 수업 목표 페이지를 0에서 총 페이지 사이로 입력해주세요.`);
      }
    }

    names.add(name);
  });
}

function validatePages(startPage: number | null | undefined, endPage: number, totalPages: number) {
  if (!Number.isFinite(endPage) || endPage <= 0) {
    badRequest('완료 페이지는 1 이상이어야 합니다.');
  }

  if (endPage > totalPages) {
    badRequest(`완료 페이지는 선택한 구성의 총 ${totalPages}페이지를 넘을 수 없습니다.`);
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

function sectionJson() {
  return `
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', sec.id::text,
          'textbook_id', sec.textbook_id::text,
          'name', sec.name,
          'total_pages', sec.total_pages,
          'first_semester_target_page', sec.first_semester_target_page,
          'current_page', sec.current_page,
          'progress_percent', ROUND((sec.current_page::numeric / NULLIF(sec.total_pages, 0)) * 100, 1)::float,
          'is_completed', (sec.current_page >= sec.total_pages),
          'sort_order', sec.sort_order,
          'created_at', sec.created_at::text,
          'updated_at', sec.updated_at::text
        )
        ORDER BY sec.sort_order, sec.name
      )
      FROM st_textbook_sections sec
      WHERE sec.textbook_id = t.id
    ), '[]'::json)
  `;
}

async function getFirstSection(textbookId: string): Promise<TextbookSection | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id::text,
      textbook_id::text,
      name,
      total_pages,
      first_semester_target_page,
      current_page,
      ROUND((current_page::numeric / NULLIF(total_pages, 0)) * 100, 1)::float AS progress_percent,
      (current_page >= total_pages) AS is_completed,
      sort_order,
      created_at::text,
      updated_at::text
    FROM st_textbook_sections
    WHERE textbook_id = ${textbookId}
    ORDER BY sort_order, name
    LIMIT 1
  `;

  const sections = rows as unknown as TextbookSection[];
  return sections[0] ? normalizeSection(sections[0]) : null;
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
  const rows = await sql.query(`
    SELECT
      t.id::text,
      t.student_id::text,
      t.subject_id::text,
      t.name,
      t.cover_image_url,
      t.curriculum_type,
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
      ) AS subject,
      ${sectionJson()} AS sections
    FROM st_textbooks t
    JOIN st_subjects s ON s.id = t.subject_id
    WHERE t.id = $1
    LIMIT 1
  `, [id]);

  const textbooks = rows as unknown as Textbook[];
  if (!textbooks[0]) return null;

  const settings = await getAcademicSettings();
  return normalizeTextbook(textbooks[0], settings.current_semester);
}

export async function getTextbooks(
  studentId: string,
  subjectId?: string,
  subjectCategories?: SubjectCategory[]
): Promise<Textbook[]> {
  const sql = getSql();
  const categoryFilter = subjectCategories?.length ? subjectCategories.join(',') : null;
  const rows = await sql.query(`
    SELECT
      t.id::text,
      t.student_id::text,
      t.subject_id::text,
      t.name,
      t.cover_image_url,
      t.curriculum_type,
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
      ) AS subject,
      ${sectionJson()} AS sections
    FROM st_textbooks t
    JOIN st_subjects s ON s.id = t.subject_id
    WHERE t.student_id = $1
      AND ($2::uuid IS NULL OR t.subject_id = $2::uuid)
      AND ($3::text IS NULL OR s.category = ANY(string_to_array($3::text, ',')))
    ORDER BY s.sort_order, (t.current_page >= t.total_pages), t.name
  `, [studentId, subjectId ?? null, categoryFilter]);

  const settings = await getAcademicSettings();
  return (rows as unknown as Textbook[]).map((textbook) =>
    normalizeTextbook(textbook, settings.current_semester)
  );
}

export async function createTextbook(textbook: TextbookInput): Promise<Textbook> {
  const name = nullableText(textbook.name);

  if (!name) {
    badRequest('교재명을 입력해주세요.');
  }

  const curriculumType = normalizeCurriculumType(textbook.curriculum_type);
  const sections = normalizeSections(textbook, curriculumType);
  validateSections(sections, curriculumType);
  const coverImageUrl = nullableText(textbook.cover_image_url);
  validateCoverImage(coverImageUrl);

  const totalPages = sections.reduce((sum, section) => sum + section.total_pages, 0);
  const sql = getSql();
  const rows = await sql`
    INSERT INTO st_textbooks (
      student_id,
      subject_id,
      name,
      cover_image_url,
      curriculum_type,
      total_pages
    )
    VALUES (
      ${textbook.student_id},
      ${textbook.subject_id},
      ${name},
      ${coverImageUrl},
      ${curriculumType},
      ${totalPages}
    )
    ON CONFLICT (student_id, subject_id, name)
    DO UPDATE SET
      total_pages = EXCLUDED.total_pages,
      cover_image_url = COALESCE(EXCLUDED.cover_image_url, st_textbooks.cover_image_url),
      curriculum_type = EXCLUDED.curriculum_type,
      current_page = LEAST(st_textbooks.current_page, EXCLUDED.total_pages),
      updated_at = NOW()
    RETURNING id::text
  `;

  const textbookId = (rows as unknown as { id: string }[])[0].id;

  for (const [index, section] of sections.entries()) {
    await sql`
      INSERT INTO st_textbook_sections (
        textbook_id,
        name,
        total_pages,
        first_semester_target_page,
        sort_order
      )
      VALUES (
        ${textbookId},
        ${section.name},
        ${section.total_pages},
        ${section.first_semester_target_page ?? null},
        ${index}
      )
      ON CONFLICT (textbook_id, name)
      DO UPDATE SET
        total_pages = EXCLUDED.total_pages,
        first_semester_target_page = EXCLUDED.first_semester_target_page,
        current_page = LEAST(st_textbook_sections.current_page, EXCLUDED.total_pages),
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `;
  }

  await recalculateTextbookProgress(textbookId);

  const created = await getTextbook(textbookId);
  if (!created) throw new Error('NOT_FOUND');

  return created;
}

export async function updateTextbook(
  id: string,
  textbook: TextbookUpdateInput
): Promise<Textbook> {
  const current = await getTextbook(id);

  if (!current) {
    throw new Error('NOT_FOUND');
  }

  const hasNameUpdate = hasOwn(textbook, 'name');
  let name = current.name;
  if (hasNameUpdate) {
    if (typeof textbook.name !== 'string') {
      badRequest('교재명을 입력해주세요.');
    }

    name = textbook.name.trim();
    if (!name) {
      badRequest('교재명을 입력해주세요.');
    }
  }

  const coverImageUrl = hasOwn(textbook, 'cover_image_url')
    ? nullableText(textbook.cover_image_url)
    : current.cover_image_url;
  validateCoverImage(coverImageUrl);

  const curriculumType = hasOwn(textbook, 'curriculum_type')
    ? normalizeCurriculumType(textbook.curriculum_type)
    : current.curriculum_type;
  const updatesBySection = new Map(
    (textbook.section_targets ?? []).map((section) => [section.id, section])
  );

  if ((textbook.section_targets ?? []).some((section) =>
    !current.sections?.some((currentSection) => currentSection.id === section.id)
  )) {
    badRequest('교재 구성 정보를 다시 확인해주세요.');
  }

  const nextSections = (current.sections ?? []).map((section) => {
    const update = updatesBySection.get(section.id);
    return {
      ...section,
      first_semester_target_page: curriculumType === 'year'
        ? update?.first_semester_target_page
          ?? section.first_semester_target_page
          ?? Math.ceil(section.total_pages / 2)
        : null,
    };
  });
  validateSections(nextSections, curriculumType);

  const sql = getSql();
  if (hasNameUpdate && name !== current.name) {
    const duplicates = await sql`
      SELECT 1
      FROM st_textbooks
      WHERE student_id = ${current.student_id}
        AND subject_id = ${current.subject_id}
        AND name = ${name}
        AND id <> ${id}
      LIMIT 1
    `;

    if ((duplicates as unknown as { exists: number }[]).length > 0) {
      badRequest('같은 과목에 동일한 이름의 교재가 이미 있습니다.');
    }
  }

  try {
    await sql`
      UPDATE st_textbooks
      SET
        name = ${name},
        cover_image_url = ${coverImageUrl},
        curriculum_type = ${curriculumType},
        updated_at = NOW()
      WHERE id = ${id}
    `;
  } catch (error) {
    if (
      typeof error === 'object'
      && error !== null
      && 'code' in error
      && error.code === '23505'
    ) {
      badRequest('같은 과목에 동일한 이름의 교재가 이미 있습니다.');
    }
    throw error;
  }

  for (const section of nextSections) {
    await sql`
      UPDATE st_textbook_sections
      SET
        first_semester_target_page = ${section.first_semester_target_page},
        updated_at = NOW()
      WHERE id = ${section.id}
    `;
  }

  const updated = await getTextbook(id);
  if (!updated) throw new Error('NOT_FOUND');

  return updated;
}

async function recalculateSectionProgress(sectionId: string): Promise<string | null> {
  const sql = getSql();
  const rows = await sql`
    UPDATE st_textbook_sections sec
    SET
      current_page = LEAST(
        sec.total_pages,
        COALESCE((
          SELECT MAX(r.end_page)
          FROM st_study_records r
          WHERE r.textbook_section_id = sec.id
        ), 0)
      ),
      updated_at = NOW()
    WHERE sec.id = ${sectionId}
    RETURNING textbook_id::text
  `;

  return (rows as unknown as { textbook_id: string }[])[0]?.textbook_id ?? null;
}

async function recalculateTextbookProgress(textbookId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE st_textbooks t
    SET
      total_pages = COALESCE((
        SELECT SUM(sec.total_pages)::int
        FROM st_textbook_sections sec
        WHERE sec.textbook_id = t.id
      ), t.total_pages),
      current_page = COALESCE((
        SELECT SUM(sec.current_page)::int
        FROM st_textbook_sections sec
        WHERE sec.textbook_id = t.id
      ), 0),
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
  const rows = await sql.query(`
    SELECT
      r.id::text,
      r.student_id::text,
      r.textbook_id::text,
      r.textbook_section_id::text,
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
        'cover_image_url', t.cover_image_url,
        'curriculum_type', t.curriculum_type,
        'total_pages', t.total_pages,
        'current_page', t.current_page,
        'progress_percent', ROUND((t.current_page::numeric / NULLIF(t.total_pages, 0)) * 100, 1)::float,
        'is_completed', (t.current_page >= t.total_pages),
        'created_at', t.created_at::text,
        'updated_at', t.updated_at::text,
        'sections', ${sectionJson()}
      ) AS textbook,
      json_build_object(
        'id', sec.id::text,
        'textbook_id', sec.textbook_id::text,
        'name', sec.name,
        'total_pages', sec.total_pages,
        'first_semester_target_page', sec.first_semester_target_page,
        'current_page', sec.current_page,
        'progress_percent', ROUND((sec.current_page::numeric / NULLIF(sec.total_pages, 0)) * 100, 1)::float,
        'is_completed', (sec.current_page >= sec.total_pages),
        'sort_order', sec.sort_order,
        'created_at', sec.created_at::text,
        'updated_at', sec.updated_at::text
      ) AS textbook_section
    FROM st_study_records r
    JOIN st_textbooks t ON t.id = r.textbook_id
    JOIN st_textbook_sections sec ON sec.id = r.textbook_section_id
    JOIN st_subjects s ON s.id = r.subject_id
    WHERE r.student_id = $1
      AND ($2::date IS NULL OR r.study_date >= $2::date)
      AND ($3::date IS NULL OR r.study_date <= $3::date)
    ORDER BY r.study_date DESC, r.created_at DESC
  `, [studentId, startDate ?? null, endDate ?? null]);

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
  const rows = await sql.query(`
    SELECT
      r.id::text,
      r.student_id::text,
      r.textbook_id::text,
      r.textbook_section_id::text,
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
        'cover_image_url', t.cover_image_url,
        'curriculum_type', t.curriculum_type,
        'total_pages', t.total_pages,
        'current_page', t.current_page,
        'progress_percent', ROUND((t.current_page::numeric / NULLIF(t.total_pages, 0)) * 100, 1)::float,
        'is_completed', (t.current_page >= t.total_pages),
        'created_at', t.created_at::text,
        'updated_at', t.updated_at::text,
        'sections', ${sectionJson()}
      ) AS textbook,
      json_build_object(
        'id', sec.id::text,
        'textbook_id', sec.textbook_id::text,
        'name', sec.name,
        'total_pages', sec.total_pages,
        'first_semester_target_page', sec.first_semester_target_page,
        'current_page', sec.current_page,
        'progress_percent', ROUND((sec.current_page::numeric / NULLIF(sec.total_pages, 0)) * 100, 1)::float,
        'is_completed', (sec.current_page >= sec.total_pages),
        'sort_order', sec.sort_order,
        'created_at', sec.created_at::text,
        'updated_at', sec.updated_at::text
      ) AS textbook_section
    FROM st_study_records r
    JOIN st_textbooks t ON t.id = r.textbook_id
    JOIN st_textbook_sections sec ON sec.id = r.textbook_section_id
    JOIN st_subjects s ON s.id = r.subject_id
    WHERE r.id = $1
    LIMIT 1
  `, [id]);

  const records = rows as unknown as StudyRecord[];
  return records[0] ?? null;
}

export async function createStudyRecord(record: StudyRecordInput): Promise<StudyRecord> {
  const textbook = await getTextbook(record.textbook_id);

  if (!textbook || textbook.student_id !== record.student_id) {
    throw new Error('NOT_FOUND');
  }

  const section = record.textbook_section_id
    ? textbook.sections?.find((item) => item.id === record.textbook_section_id)
    : await getFirstSection(record.textbook_id);

  if (!section) {
    throw new Error('NOT_FOUND');
  }

  validatePages(record.start_page, record.end_page, section.total_pages);

  const sql = getSql();
  const rows = await sql`
    INSERT INTO st_study_records (
      student_id,
      textbook_id,
      textbook_section_id,
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
      ${section.id},
      ${textbook.subject_id},
      ${record.study_date}::date,
      ${record.start_page ?? null},
      ${record.end_page},
      ${record.duration_minutes ?? null},
      ${nullableText(record.memo)}
    )
    RETURNING id::text
  `;

  const textbookId = await recalculateSectionProgress(section.id);
  if (textbookId) {
    await recalculateTextbookProgress(textbookId);
  }

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

  const nextSectionId = record.textbook_section_id ?? (
    nextTextbookId === current.textbook_id ? current.textbook_section_id : textbook.sections?.[0]?.id
  );
  const section = textbook.sections?.find((item) => item.id === nextSectionId);

  if (!section) {
    throw new Error('NOT_FOUND');
  }

  const next = {
    textbook_id: nextTextbookId,
    textbook_section_id: section.id,
    subject_id: textbook.subject_id,
    study_date: record.study_date ?? current.study_date,
    start_page: hasOwn(record, 'start_page') ? record.start_page ?? null : current.start_page,
    end_page: record.end_page ?? current.end_page,
    duration_minutes: hasOwn(record, 'duration_minutes')
      ? record.duration_minutes ?? null
      : current.duration_minutes,
    memo: hasOwn(record, 'memo') ? nullableText(record.memo) : current.memo,
  };

  validatePages(next.start_page, next.end_page, section.total_pages);

  const sql = getSql();
  await sql`
    UPDATE st_study_records
    SET
      textbook_id = ${next.textbook_id},
      textbook_section_id = ${next.textbook_section_id},
      subject_id = ${next.subject_id},
      study_date = ${next.study_date}::date,
      start_page = ${next.start_page},
      end_page = ${next.end_page},
      duration_minutes = ${next.duration_minutes},
      memo = ${next.memo},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const currentTextbookId = await recalculateSectionProgress(current.textbook_section_id);
  if (currentTextbookId) {
    await recalculateTextbookProgress(currentTextbookId);
  }

  if (current.textbook_section_id !== next.textbook_section_id) {
    const nextRecalculatedTextbookId = await recalculateSectionProgress(next.textbook_section_id);
    if (nextRecalculatedTextbookId) {
      await recalculateTextbookProgress(nextRecalculatedTextbookId);
    }
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
    RETURNING textbook_section_id::text
  `;

  const deleted = (rows as unknown as { textbook_section_id: string }[])[0];
  if (!deleted) {
    throw new Error('NOT_FOUND');
  }

  const textbookId = await recalculateSectionProgress(deleted.textbook_section_id);
  if (textbookId) {
    await recalculateTextbookProgress(textbookId);
  }
}
