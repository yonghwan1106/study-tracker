import { NextResponse } from 'next/server';
import { getSubjects } from '@/lib/server/studyQueries';
import { handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getSubjects());
  } catch (error) {
    return handleRouteError(error);
  }
}
