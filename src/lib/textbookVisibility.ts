import type { Textbook } from '@/types/database';

export const SECOND_SEMESTER_START_DATE = '2026-08-03';
export const FIRST_SEMESTER_ARCHIVE_DATE = '2026-07-31';
export const CURRENT_SCHOOL_GRADE = 1;

type TextbookIdentity = Pick<Textbook, 'name' | 'curriculum_type'>;

const GRADE_SEMESTER_PATTERN = /(^|[^0-9])([1-3])\s*-\s*([12])([^0-9]|$)/;
const GRADE_PATTERN = /(^|[^0-9])([1-3])\s*학년([^0-9]|$)/;

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

function getTextbookCourse(name: string) {
  const semesterMatch = name.match(GRADE_SEMESTER_PATTERN);
  if (semesterMatch) {
    return {
      grade: Number(semesterMatch[2]),
      semester: Number(semesterMatch[3]) as 1 | 2,
    };
  }

  const gradeMatch = name.match(GRADE_PATTERN);
  return gradeMatch
    ? { grade: Number(gradeMatch[2]), semester: null }
    : null;
}

export function isAdvancedGradeTextbook(
  textbook: TextbookIdentity,
  currentGrade = CURRENT_SCHOOL_GRADE
) {
  const course = getTextbookCourse(textbook.name);
  return course !== null && course.grade > currentGrade;
}

export function isFirstSemesterTextbook(
  textbook: TextbookIdentity
) {
  if (textbook.curriculum_type === 'year') return false;
  return getTextbookCourse(textbook.name)?.semester === 1;
}

export function isSecondSemesterTextbook(
  textbook: TextbookIdentity
) {
  if (textbook.curriculum_type === 'year') return false;
  return getTextbookCourse(textbook.name)?.semester === 2;
}

function isCurrentGradeFirstSemesterTextbook(textbook: TextbookIdentity) {
  const course = getTextbookCourse(textbook.name);
  return (
    textbook.curriculum_type !== 'year'
    && course?.grade === CURRENT_SCHOOL_GRADE
    && course.semester === 1
  );
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
        if (isCurrentGradeFirstSemesterTextbook(textbook)) {
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
        || isAdvancedGradeTextbook(textbook)
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
