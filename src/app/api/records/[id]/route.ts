import { NextRequest, NextResponse } from 'next/server';
import {
  deleteStudyRecord,
  getStudyRecord,
  updateStudyRecord,
  StudyRecordUpdateInput,
} from '@/lib/server/studyQueries';
import { badRequest, handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const record = await getStudyRecord(id);

    if (!record) {
      return NextResponse.json({ error: '요청한 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as StudyRecordUpdateInput;

    if (
      body.end_page !== undefined &&
      (!Number.isFinite(body.end_page) || body.end_page <= 0)
    ) {
      return badRequest('완료 페이지는 1 이상이어야 합니다.');
    }

    if (
      body.duration_minutes !== null &&
      body.duration_minutes !== undefined &&
      (!Number.isFinite(body.duration_minutes) || body.duration_minutes <= 0)
    ) {
      return badRequest('학습 시간은 1분 이상이어야 합니다.');
    }

    return NextResponse.json(await updateStudyRecord(id, body));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteStudyRecord(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
