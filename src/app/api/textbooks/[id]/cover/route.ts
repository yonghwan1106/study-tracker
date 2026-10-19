import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { badRequest, handleRouteError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decodeCover(value: string | null | undefined) {
  if (!value || value.length > 900_000) return null;
  const header = /^data:(image\/(?:jpeg|png|gif|webp));base64,/.exec(value);
  if (!header) return null;
  const payload = value.slice(header[0].length);
  if (!payload || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) {
    return null;
  }

  const bytes = Buffer.from(payload, 'base64');
  if (bytes.toString('base64') !== payload) return null;
  const mime = header[1];
  // Reject payloads that claim to be an image but do not have that format's signature.
  const validSignature = (
    (mime === 'image/jpeg' && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    || (mime === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    || (mime === 'image/gif' && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii')))
    || (mime === 'image/webp' && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
      && bytes.subarray(8, 12).toString('ascii') === 'WEBP')
  );
  return validSignature ? { bytes, mime } : null;
}

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!uuidPattern.test(id)) {
      return noStore(badRequest('id must be a valid UUID.'));
    }

    const sql = getSql();
    const rows = await sql`
      SELECT cover_image_url
      FROM st_textbooks
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    const cover = decodeCover((rows as unknown as { cover_image_url: string | null }[])[0]?.cover_image_url);
    if (!cover) {
      return noStore(NextResponse.json({ error: 'Cover image not found.' }, { status: 404 }));
    }

    const etag = `"${createHash('sha256').update(cover.bytes).digest('hex')}"`;
    const headers = {
      'Content-Type': cover.mime,
      'Cache-Control': request.nextUrl.searchParams.get('v')
        ? 'private, max-age=86400'
        : 'private, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    };
    const validators = request.headers.get('if-none-match')?.split(',').map((value) => value.trim());
    if (validators?.some((value) => value === '*' || value.replace(/^W\//, '') === etag)) {
      return new NextResponse(null, { status: 304, headers });
    }

    return new NextResponse(new Uint8Array(cover.bytes), {
      headers: { ...headers, 'Content-Length': String(cover.bytes.length) },
    });
  } catch (error) {
    return noStore(handleRouteError(error));
  }
}
