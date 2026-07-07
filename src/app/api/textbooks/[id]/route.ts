import { NextRequest, NextResponse } from 'next/server';
import {
  getTextbook,
  TextbookUpdateInput,
  updateTextbook,
} from '@/lib/server/studyQueries';
import { handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const textbook = await getTextbook(id);

    if (!textbook) {
      return NextResponse.json({ error: '요청한 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(textbook);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as TextbookUpdateInput;

    return NextResponse.json(await updateTextbook(id, body));
  } catch (error) {
    return handleRouteError(error);
  }
}
