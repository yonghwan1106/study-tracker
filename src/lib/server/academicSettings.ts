import { getSql } from '@/lib/db';

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
  if (settings) return settings;

  await sql`
    INSERT INTO st_academic_settings (id, current_semester)
    VALUES (TRUE, 1)
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
