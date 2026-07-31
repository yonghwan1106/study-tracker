import type { Textbook } from '@/types/database';

export const SECOND_SEMESTER_START_DATE = '2026-08-03';
export const FIRST_SEMESTER_ARCHIVE_DATE = '2026-07-31';

function getSeoulDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getScheduledSemester(date: Date = new Date()): 1 | 2 {
  return getSeoulDateKey(date) >= SECOND_SEMESTER_START_DATE ? 2 : 1;
}

export function isFirstSemesterTextbook(
  textbook: Pick<Textbook, 'name' | 'curriculum_type'>
) {
  if (textbook.curriculum_type === 'year') return false;
  return /(^|[^0-9])\d+\s*-\s*1([^0-9]|$)/.test(textbook.name);
}

export function isSecondSemesterTextbook(
  textbook: Pick<Textbook, 'name' | 'curriculum_type'>
) {
  if (textbook.curriculum_type === 'year') return false;
  return /(^|[^0-9])\d+\s*-\s*2([^0-9]|$)/.test(textbook.name);
}

export function partitionTextbooksForCurrentSemester(
  textbooks: Textbook[],
  date: Date = new Date()
) {
  const seoulDateKey = getSeoulDateKey(date);

  if (seoulDateKey < FIRST_SEMESTER_ARCHIVE_DATE) {
    return {
      isArchiveActive: false,
      isSecondSemester: false,
      currentTextbooks: textbooks,
      previousTextbooks: [] as Textbook[],
    };
  }

  if (seoulDateKey < SECOND_SEMESTER_START_DATE) {
    return textbooks.reduce(
      (result, textbook) => {
        if (isFirstSemesterTextbook(textbook)) {
          result.previousTextbooks.push(textbook);
        } else {
          result.currentTextbooks.push(textbook);
        }
        return result;
      },
      {
        isArchiveActive: true,
        isSecondSemester: false,
        currentTextbooks: [] as Textbook[],
        previousTextbooks: [] as Textbook[],
      }
    );
  }

  return textbooks.reduce(
    (result, textbook) => {
      if (
        textbook.curriculum_type === 'year'
        || isSecondSemesterTextbook(textbook)
      ) {
        result.currentTextbooks.push(textbook);
      } else {
        result.previousTextbooks.push(textbook);
      }
      return result;
    },
    {
      isArchiveActive: true,
      isSecondSemester: true,
      currentTextbooks: [] as Textbook[],
      previousTextbooks: [] as Textbook[],
    }
  );
}
