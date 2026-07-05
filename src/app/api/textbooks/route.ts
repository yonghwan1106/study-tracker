import { NextRequest, NextResponse } from 'next/server';
import { createTextbook, getTextbooks, TextbookInput } from '@/lib/server/studyQueries';
import { badRequest, handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId') ?? undefined;
    const subjectId = request.nextUrl.searchParams.get('subjectId') ?? undefined;

    if (!studentId) {
      return badRequest('studentId가 필요합니다.');
    }

    return NextResponse.json(await getTextbooks(studentId, subjectId));
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

    if (!Number.isFinite(body.total_pages) || body.total_pages <= 0) {
      return badRequest('총 페이지는 1 이상이어야 합니다.');
    }

    return NextResponse.json(await createTextbook(body), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
