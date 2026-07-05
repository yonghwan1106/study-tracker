import { NextRequest, NextResponse } from 'next/server';
import {
  createStudyRecord,
  getStudyRecords,
  getStudyRecordsByDate,
  StudyRecordInput,
} from '@/lib/server/studyQueries';
import { badRequest, handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const studentId = searchParams.get('studentId');
  const date = searchParams.get('date') ?? undefined;
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;

  if (!studentId) {
    return badRequest('studentId가 필요합니다.');
  }

  try {
    const records = date
      ? await getStudyRecordsByDate(studentId, date)
      : await getStudyRecords(studentId, startDate, endDate);

    return NextResponse.json(records);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StudyRecordInput;

    if (!body.student_id || !body.textbook_id || !body.study_date) {
      return badRequest('학생, 교재, 날짜는 필수입니다.');
    }

    if (!Number.isFinite(body.end_page) || body.end_page <= 0) {
      return badRequest('완료 페이지는 1 이상이어야 합니다.');
    }

    if (
      body.duration_minutes !== null &&
      body.duration_minutes !== undefined &&
      (!Number.isFinite(body.duration_minutes) || body.duration_minutes <= 0)
    ) {
      return badRequest('학습 시간은 1분 이상이어야 합니다.');
    }

    const record = await createStudyRecord(body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
