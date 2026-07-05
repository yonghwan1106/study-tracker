import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyGoals, setWeeklyGoal, WeeklyGoalInput } from '@/lib/server/studyQueries';
import { badRequest, handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const studentId = searchParams.get('studentId');
  const year = Number(searchParams.get('year'));
  const weekNumber = Number(searchParams.get('weekNumber'));

  if (!studentId || !Number.isFinite(year) || !Number.isFinite(weekNumber)) {
    return badRequest('studentId, year, weekNumber가 필요합니다.');
  }

  try {
    return NextResponse.json(await getWeeklyGoals(studentId, year, weekNumber));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WeeklyGoalInput;

    if (!body.student_id || !body.subject_id) {
      return badRequest('학생과 과목은 필수입니다.');
    }

    if (
      !Number.isFinite(body.year) ||
      !Number.isFinite(body.week_number) ||
      !Number.isFinite(body.target_minutes) ||
      body.target_minutes < 0
    ) {
      return badRequest('주간 목표 값이 올바르지 않습니다.');
    }

    return NextResponse.json(await setWeeklyGoal(body));
  } catch (error) {
    return handleRouteError(error);
  }
}
