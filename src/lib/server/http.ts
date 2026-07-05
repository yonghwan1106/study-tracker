import { NextResponse } from 'next/server';

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function handleRouteError(error: unknown) {
  console.error(error);

  if (error instanceof Error && error.message === 'NOT_FOUND') {
    return NextResponse.json({ error: '요청한 데이터를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (error instanceof Error && error.message.startsWith('BAD_REQUEST:')) {
    return NextResponse.json({ error: error.message.replace('BAD_REQUEST:', '') }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
  return NextResponse.json({ error: message }, { status: 500 });
}
