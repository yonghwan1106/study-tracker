import { neon } from '@neondatabase/serverless';

let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sqlInstance) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
    }

    sqlInstance = neon(databaseUrl);
  }

  return sqlInstance;
}
