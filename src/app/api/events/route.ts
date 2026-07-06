import { NextRequest, NextResponse } from 'next/server';
import {
  createSchoolEvent,
  getSchoolEvents,
  getUpcomingSchoolEvents,
  SchoolEventInput,
} from '@/lib/server/eventQueries';
import { badRequest, handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const studentId = searchParams.get('studentId') ?? undefined;
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  const fromDate = searchParams.get('fromDate') ?? undefined;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

  if (!studentId) {
    return badRequest('studentId가 필요합니다.');
  }

  try {
    const events = fromDate
      ? await getUpcomingSchoolEvents(studentId, fromDate, limit)
      : await getSchoolEvents(studentId, startDate, endDate);

    return NextResponse.json(events);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SchoolEventInput;

    if (!body.student_id || !body.event_type || !body.title || !body.start_date) {
      return badRequest('학생, 일정 종류, 제목, 시작일은 필수입니다.');
    }

    return NextResponse.json(await createSchoolEvent(body), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
