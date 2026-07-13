import { NextRequest, NextResponse } from 'next/server';
import { getAcademicSettings, updateAcademicSettings } from '@/lib/server/academicSettings';
import { handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getAcademicSettings());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { current_semester?: number };
    return NextResponse.json(await updateAcademicSettings(body.current_semester ?? 0));
  } catch (error) {
    return handleRouteError(error);
  }
}
