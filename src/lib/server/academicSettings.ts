import { getSql } from '@/lib/db';
import { getScheduledSemester } from '@/lib/textbookVisibility';

export interface AcademicSettings {
  current_semester: 1 | 2;
  updated_at: string;
}

export async function getAcademicSettings(): Promise<AcademicSettings> {
  const sql = getSql();
  const rows = await sql`
    SELECT current_semester, updated_at::text
    FROM st_academic_settings
    WHERE id = TRUE
  `;

  const settings = (rows as unknown as AcademicSettings[])[0];
  if (settings) {
    if (getScheduledSemester() === 1 || settings.current_semester === 2) return settings;

    const updatedRows = await sql`
      UPDATE st_academic_settings
      SET current_semester = 2, updated_at = NOW()
      WHERE id = TRUE
        AND current_semester = 1
        AND updated_at < '2026-08-03T00:00:00+09:00'::timestamptz
      RETURNING current_semester, updated_at::text
    `;
    return (updatedRows as unknown as AcademicSettings[])[0] ?? settings;
  }

  const scheduledSemester = getScheduledSemester();
  await sql`
    INSERT INTO st_academic_settings (id, current_semester)
    VALUES (TRUE, ${scheduledSemester})
    ON CONFLICT (id) DO NOTHING
  `;

  return getAcademicSettings();
}

export async function updateAcademicSettings(
  currentSemester: number
): Promise<AcademicSettings> {
  if (currentSemester !== 1 && currentSemester !== 2) {
    throw new Error('BAD_REQUEST:학기는 1학기 또는 2학기여야 합니다.');
  }

  const sql = getSql();
  const rows = await sql`
    INSERT INTO st_academic_settings (id, current_semester, updated_at)
    VALUES (TRUE, ${currentSemester}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      current_semester = EXCLUDED.current_semester,
      updated_at = NOW()
    RETURNING current_semester, updated_at::text
  `;

  return (rows as unknown as AcademicSettings[])[0];
}
