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

    if (!body.student_id || !body.subject_id || !body.study_date) {
      return badRequest('학생, 과목, 날짜는 필수입니다.');
    }

    if (!Number.isFinite(body.duration_minutes) || body.duration_minutes <= 0) {
      return badRequest('학습 시간은 1분 이상이어야 합니다.');
    }

    const record = await createStudyRecord(body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
