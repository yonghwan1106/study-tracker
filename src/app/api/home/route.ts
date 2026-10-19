import { NextRequest, NextResponse } from 'next/server';
import { getHomeData } from '@/lib/server/homeQueries';
import { badRequest, handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('studentId');
  const date = request.nextUrl.searchParams.get('date');

  if (!studentId || !uuidPattern.test(studentId)) {
    return noStore(badRequest('studentId must be a valid UUID.'));
  }
  if (!date || !isIsoDate(date)) {
    return noStore(badRequest('date must be a real date in YYYY-MM-DD format.'));
  }

  try {
    return noStore(NextResponse.json(await getHomeData(studentId, date)));
  } catch (error) {
    return noStore(handleRouteError(error));
  }
}
