import { NextRequest, NextResponse } from 'next/server';
import {
  deleteSchoolEvent,
  getSchoolEvent,
  SchoolEventUpdateInput,
  updateSchoolEvent,
} from '@/lib/server/eventQueries';
import { handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const event = await getSchoolEvent(id);

    if (!event) {
      return NextResponse.json({ error: '요청한 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as SchoolEventUpdateInput;

    return NextResponse.json(await updateSchoolEvent(id, body));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteSchoolEvent(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
