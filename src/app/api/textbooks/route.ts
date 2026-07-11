import { NextRequest, NextResponse } from 'next/server';
import { createTextbook, getTextbooks, TextbookInput } from '@/lib/server/studyQueries';
import { badRequest, handleRouteError } from '@/lib/server/http';
import type { Subject } from '@/types/database';

export const dynamic = 'force-dynamic';

type SubjectCategory = Subject['category'];

const allowedSubjectCategories = new Set<SubjectCategory>([
  'korean',
  'english',
  'math',
  'science',
  'social',
]);

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId') ?? undefined;
    const subjectId = request.nextUrl.searchParams.get('subjectId') ?? undefined;
    const subjectCategoriesParam = request.nextUrl.searchParams.get('subjectCategories');
    const subjectCategories = subjectCategoriesParam
      ?.split(',')
      .map((category) => category.trim())
      .filter(Boolean);

    if (!studentId) {
      return badRequest('studentId가 필요합니다.');
    }

    if (
      subjectCategories?.some(
        (category) => !allowedSubjectCategories.has(category as SubjectCategory)
      )
    ) {
      return badRequest('지원하지 않는 과목 분류입니다.');
    }

    return NextResponse.json(
      await getTextbooks(
        studentId,
        subjectId,
        subjectCategories as SubjectCategory[] | undefined
      )
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TextbookInput;

    if (!body.student_id || !body.subject_id || !body.name) {
      return badRequest('학생, 과목, 교재명은 필수입니다.');
    }

    const hasSections = Array.isArray(body.sections) && body.sections.length > 0;
    const hasLegacyPages = Number.isFinite(body.total_pages) && Number(body.total_pages) > 0;

    if (!hasSections && !hasLegacyPages) {
      return badRequest('교재 구성을 1개 이상 입력해주세요.');
    }

    if (
      hasSections &&
      body.sections?.some((section) => !section.name || !Number.isFinite(section.total_pages) || section.total_pages <= 0)
    ) {
      return badRequest('각 구성의 이름과 총 페이지를 입력해주세요.');
    }

    return NextResponse.json(await createTextbook(body), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
