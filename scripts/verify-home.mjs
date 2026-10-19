import assert from 'node:assert/strict';

// Read-only comparison against the existing detail APIs; run against local or production.
const base = process.argv[2] ?? 'http://127.0.0.1:3010';
const dates = process.argv.slice(3);
if (!dates.length) dates.push('2026-10-12', '2026-10-19');

async function read(path) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  return response.json();
}

const students = await read('/api/students');
for (const student of students) {
  const detailed = await read(`/api/textbooks?studentId=${student.id}&subjectCategories=math,english,korean`);
  for (const date of dates) {
    const start = new Date(`${date}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const [home, records] = await Promise.all([
      read(`/api/home?studentId=${student.id}&date=${date}`),
      read(`/api/records?studentId=${student.id}&startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}`),
    ]);
    assert.equal(home.textbooks.length, detailed.length);
    for (const book of home.textbooks) {
      const original = detailed.find((item) => item.id === book.id);
      assert.ok(original);
      for (const field of ['name', 'current_page', 'total_pages', 'progress_percent', 'curriculum_type']) {
        assert.equal(book[field], original[field], `${book.name}: ${field}`);
      }
      assert.equal(book.round_number, original.active_round.round_number);
      assert.equal(book.completed_round_count, original.rounds.filter((round) => round.is_completed).length);
      assert.equal(book.is_completed, original.active_round.is_completed);
      assert.equal(Boolean(book.cover_image_url), Boolean(original.cover_image_url));
      assert.ok(!('sections' in book));
      assert.ok(!('rounds' in book));
    }
    const today = records.filter((record) => record.study_date === date);
    assert.deepEqual(home.todayRecords.map((record) => record.id).sort(), today.map((record) => record.id).sort());
    for (const record of home.todayRecords) {
      const original = today.find((item) => item.id === record.id);
      for (const field of ['start_page', 'end_page', 'pages_done', 'round_number']) {
        assert.equal(record[field], original[field]);
      }
      assert.equal(record.textbook.name, original.textbook.name);
      assert.equal(record.textbook_section.name, original.textbook_section.name);
    }
    const pages = (record) => record.pages_done ?? (record.start_page == null ? 0 : Math.max(0, record.end_page - record.start_page + 1));
    assert.equal(home.weeklyStats.totalPages, records.reduce((sum, record) => sum + pages(record), 0));
    assert.equal(home.weeklyStats.recordCount, records.length);
    for (const item of home.weeklyStats.subjectBreakdown) {
      assert.equal(item.pages, records.filter((record) => record.subject_id === item.subject.id).reduce((sum, record) => sum + pages(record), 0));
    }
    assert.ok(!JSON.stringify(home).includes('data:image/'));
    const cover = home.textbooks.find((book) => book.cover_image_url);
    if (cover) {
      const response = await fetch(base + cover.cover_image_url);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /^image\//);
      assert.match(response.headers.get('cache-control'), /max-age=86400/);
      const original = detailed.find((book) => book.id === cover.id);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(original.cover_image_url.split(',')[1], 'base64'));
    }
    console.log(`${student.name} ${date}: matched ${home.textbooks.length} books, ${today.length} daily / ${records.length} weekly records; ${Buffer.byteLength(JSON.stringify(home))} bytes`);
  }
}
for (const path of ['/api/home?studentId=invalid&date=2026-10-19', `/api/home?studentId=${students[0].id}&date=2026-02-30`]) {
  assert.equal((await fetch(base + path)).status, 400);
}
console.log('Home API verification passed. No data was modified.');
