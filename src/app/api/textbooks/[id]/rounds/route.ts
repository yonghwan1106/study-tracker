import { NextRequest, NextResponse } from 'next/server';
import { startNextTextbookRound } from '@/lib/server/studyQueries';
import { handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return NextResponse.json(await startNextTextbookRound(id), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
