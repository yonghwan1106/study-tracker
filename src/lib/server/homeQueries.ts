import { getSql } from '@/lib/db';
import type { HomeData, HomeStudyRecord, HomeTextbook } from '@/types/home';

interface CoverReference {
  id: string;
  cover_version: string | null;
}

type HomeTextbookRow = Omit<HomeTextbook, 'cover_image_url'> & CoverReference;
type HomeStudyRecordRow = Omit<HomeStudyRecord, 'textbook'> & {
  textbook: Omit<NonNullable<HomeStudyRecord['textbook']>, 'cover_image_url'> & CoverReference;
};

function coverUrl(id: string, version: string | null): string | null {
  return version === null
    ? null
    : `/api/textbooks/${encodeURIComponent(id)}/cover?v=${encodeURIComponent(version)}`;
}

export async function getHomeData(studentId: string, date: string): Promise<HomeData> {
  const sql = getSql();
  // Read progress mirrors and round metadata only; never load cover payloads or round sections.
  const rows = await sql.query(`
    WITH books AS MATERIALIZED (
      SELECT
        t.id,
        t.name,
        t.curriculum_type,
        t.current_page,
        t.total_pages,
        LEAST(100, COALESCE(ROUND(
          t.current_page::numeric / NULLIF(t.total_pages, 0) * 100, 1
        ), 0))::float AS progress_percent,
        CASE WHEN t.cover_image_url IS NOT NULL
          THEN COALESCE(t.updated_at::text, '') ELSE NULL END AS cover_version,
        s.category,
        s.sort_order,
        json_build_object(
          'id', s.id::text, 'name', s.name, 'category', s.category,
          'color', s.color, 'sort_order', s.sort_order
        ) AS subject
      FROM st_textbooks t
      JOIN st_subjects s ON s.id = t.subject_id
      WHERE t.student_id = $1::uuid
    ), home_books AS (
      SELECT
        b.*,
        COALESCE(rounds.round_number, 1) AS round_number,
        rounds.completed_round_count,
        COALESCE(latest.status = 'completed', b.current_page >= b.total_pages) AS is_completed
      FROM books b
      LEFT JOIN LATERAL (
        SELECT MAX(tr.round_number) AS round_number,
          COUNT(*) FILTER (WHERE tr.status = 'completed')::int AS completed_round_count
        FROM st_textbook_rounds tr
        WHERE tr.textbook_id = b.id
      ) rounds ON TRUE
      LEFT JOIN st_textbook_rounds latest
        ON latest.textbook_id = b.id AND latest.round_number = rounds.round_number
      WHERE b.category IN ('math', 'english', 'korean')
    ), week_records AS MATERIALIZED (
      SELECT
        r.id, r.textbook_id, r.textbook_round_id, r.textbook_section_id,
        r.subject_id, r.study_date, r.start_page, r.end_page, r.created_at,
        CASE WHEN r.start_page IS NULL THEN NULL
          ELSE GREATEST(r.end_page - r.start_page + 1, 0) END AS pages_done
      FROM st_study_records r
      WHERE r.student_id = $1::uuid
        AND r.study_date >= date_trunc('week', $2::date::timestamp)::date
        AND r.study_date < date_trunc('week', $2::date::timestamp)::date + 7
    ), subject_totals AS (
      SELECT r.subject_id, COALESCE(SUM(r.pages_done), 0) AS pages
      FROM week_records r
      GROUP BY r.subject_id
    )
    SELECT
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', b.id::text, 'name', b.name, 'curriculum_type', b.curriculum_type,
          'current_page', b.current_page, 'total_pages', b.total_pages,
          'progress_percent', b.progress_percent, 'subject', b.subject,
          'cover_version', b.cover_version, 'round_number', b.round_number,
          'completed_round_count', b.completed_round_count, 'is_completed', b.is_completed
        ) ORDER BY b.sort_order, b.is_completed, b.name)
        FROM home_books b
      ), '[]'::json) AS textbooks,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', r.id::text, 'study_date', to_char(r.study_date, 'YYYY-MM-DD'),
          'start_page', r.start_page, 'end_page', r.end_page, 'pages_done', r.pages_done,
          'round_number', tr.round_number,
          'subject', json_build_object(
            'id', s.id::text, 'name', s.name, 'category', s.category,
            'color', s.color, 'sort_order', s.sort_order
          ),
          'textbook', json_build_object(
            'id', b.id::text, 'name', b.name, 'cover_version', b.cover_version,
            'progress_percent', b.progress_percent
          ),
          'textbook_section', json_build_object('name', sec.name)
        ) ORDER BY r.created_at DESC, r.id)
        FROM week_records r
        JOIN books b ON b.id = r.textbook_id
        JOIN st_textbook_rounds tr ON tr.id = r.textbook_round_id
        JOIN st_textbook_sections sec ON sec.id = r.textbook_section_id
        JOIN st_subjects s ON s.id = r.subject_id
        WHERE r.study_date = $2::date
      ), '[]'::json) AS "todayRecords",
      json_build_object(
        'totalPages', (SELECT COALESCE(SUM(pages_done), 0) FROM week_records),
        'recordCount', (SELECT COUNT(*) FROM week_records),
        'subjectBreakdown', COALESCE((
          SELECT json_agg(json_build_object(
            'subject', json_build_object(
              'id', s.id::text, 'name', s.name, 'category', s.category,
              'color', s.color, 'sort_order', s.sort_order
            ),
            'pages', totals.pages
          ) ORDER BY totals.pages DESC, s.sort_order, s.id)
          FROM subject_totals totals
          JOIN st_subjects s ON s.id = totals.subject_id
        ), '[]'::json)
      ) AS "weeklyStats"
  `, [studentId, date]);

  const data = (rows as unknown as {
    textbooks: HomeTextbookRow[];
    todayRecords: HomeStudyRecordRow[];
    weeklyStats: HomeData['weeklyStats'];
  }[])[0];

  return {
    textbooks: data.textbooks.map(({ cover_version, ...book }) => ({
      ...book,
      cover_image_url: coverUrl(book.id, cover_version),
    })),
    todayRecords: data.todayRecords.map(({ textbook, ...record }) => ({
      ...record,
      textbook: {
        name: textbook.name,
        progress_percent: textbook.progress_percent,
        cover_image_url: coverUrl(textbook.id, textbook.cover_version),
      },
    })),
    weeklyStats: data.weeklyStats,
  };
}
