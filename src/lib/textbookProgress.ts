import { SchoolProgress, Textbook, TextbookSection } from '@/types/database';

type ProgressTextbook = Pick<Textbook, 'curriculum_type' | 'current_page' | 'total_pages' | 'sections'>;
type ProgressSection = Pick<
  TextbookSection,
  'current_page' | 'total_pages' | 'first_semester_target_page'
>;

function calculatePercent(currentPages: number, targetPages: number) {
  if (targetPages <= 0) return 100;
  return Math.min(100, Math.round((currentPages / targetPages) * 1000) / 10);
}

function firstSemesterTarget(section: ProgressSection) {
  return section.first_semester_target_page ?? Math.ceil(section.total_pages / 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getSchoolProgress(
  textbook: ProgressTextbook,
  currentSemester: 1 | 2
): SchoolProgress {
  const sections = textbook.sections?.length
    ? textbook.sections
    : [{
        current_page: textbook.current_page,
        total_pages: textbook.total_pages,
        first_semester_target_page: null,
      }];

  if (textbook.curriculum_type !== 'year') {
    return {
      current_semester: currentSemester,
      current_pages: textbook.current_page,
      target_pages: textbook.total_pages,
      progress_percent: calculatePercent(textbook.current_page, textbook.total_pages),
      is_completed: textbook.current_page >= textbook.total_pages,
    };
  }

  const progress = sections.reduce(
    (result, section) => {
      const firstTarget = firstSemesterTarget(section);
      const targetPages = currentSemester === 1
        ? firstTarget
        : section.total_pages - firstTarget;
      const currentPages = currentSemester === 1
        ? clamp(section.current_page, 0, firstTarget)
        : clamp(section.current_page - firstTarget, 0, targetPages);

      return {
        currentPages: result.currentPages + currentPages,
        targetPages: result.targetPages + targetPages,
      };
    },
    { currentPages: 0, targetPages: 0 }
  );

  return {
    current_semester: currentSemester,
    current_pages: progress.currentPages,
    target_pages: progress.targetPages,
    progress_percent: calculatePercent(progress.currentPages, progress.targetPages),
    is_completed: progress.targetPages === 0 || progress.currentPages >= progress.targetPages,
  };
}
