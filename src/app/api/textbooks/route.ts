import { NextRequest, NextResponse } from 'next/server';
import { getTextbooks } from '@/lib/server/studyQueries';
import { handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const subjectId = request.nextUrl.searchParams.get('subjectId') ?? undefined;
    return NextResponse.json(await getTextbooks(subjectId));
  } catch (error) {
    return handleRouteError(error);
  }
}
