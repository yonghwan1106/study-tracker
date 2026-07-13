'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Textbook } from '@/types/database';
import { useStudent } from '@/components/layout/StudentContext';
import TextbookCover from '@/components/textbooks/TextbookCover';
import {
  getAcademicSettings,
  getTextbooks,
  updateAcademicSettings,
} from '@/lib/api';
import { BookOpen, CheckCircle2, Loader2, Plus } from 'lucide-react';

export default function GoalForm() {
  const { selectedStudent } = useStudent();
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSemester, setCurrentSemester] = useState<1 | 2>(1);
  const [semesterSaving, setSemesterSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const [textbookData, settings] = await Promise.all([
          getTextbooks(selectedStudent.id),
          getAcademicSettings(),
        ]);
        setTextbooks(textbookData);
        setCurrentSemester(settings.current_semester);
      } catch (error) {
        console.error('Error loading textbooks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedStudent]);

  const groupedTextbooks = useMemo(() => {
    const map = new Map<string, { subjectName: string; color: string; textbooks: Textbook[] }>();

    textbooks.forEach((textbook) => {
      const key = textbook.subject_id;
      if (!map.has(key)) {
        map.set(key, {
          subjectName: textbook.subject?.name ?? '과목',
          color: textbook.subject?.color ?? '#8b9aaa',
          textbooks: [],
        });
      }
      map.get(key)?.textbooks.push(textbook);
    });

    return Array.from(map.values());
  }, [textbooks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedCount = textbooks.filter((textbook) => textbook.is_completed).length;
  const averageProgress = textbooks.length > 0
    ? Math.round(textbooks.reduce((sum, textbook) => sum + textbook.progress_percent, 0) / textbooks.length)
    : 0;

  const handleSemesterChange = async (semester: 1 | 2) => {
    if (!selectedStudent || semester === currentSemester || semesterSaving) return;

    setSemesterSaving(true);
    try {
      await updateAcademicSettings(semester);
      setCurrentSemester(semester);
      setTextbooks(await getTextbooks(selectedStudent.id));
    } catch (error) {
      console.error('Error updating academic semester:', error);
    } finally {
      setSemesterSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">수업 기준</p>
        <div className="inline-flex rounded-lg border border-border p-1" role="group" aria-label="현재 수업 학기">
          {([1, 2] as const).map((semester) => (
            <button
              key={semester}
              type="button"
              onClick={() => handleSemesterChange(semester)}
              disabled={semesterSaving}
              aria-pressed={currentSemester === semester}
              className={`min-w-14 rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
                currentSemester === semester
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-background'
              } disabled:opacity-50`}
            >
              {semester}학기
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 bg-card border border-border rounded-xl">
          <BookOpen className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted">등록</p>
          <p className="text-2xl font-bold">{textbooks.length}</p>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-muted">완료</p>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-xl">
          <span className="block text-xl mb-1">%</span>
          <p className="text-sm text-muted">평균</p>
          <p className="text-2xl font-bold text-primary">{averageProgress}%</p>
        </div>
      </div>

      {textbooks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted mb-4">아직 등록된 교재가 없습니다</p>
          <Link
            href="/record"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            첫 교재 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedTextbooks.map((group) => (
            <section key={group.subjectName} className="space-y-3">
              <h2 className="font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                {group.subjectName}
              </h2>

              <div className="space-y-3">
                {group.textbooks.map((textbook) => (
                  <Link
                    key={textbook.id}
                    href={`/record?textbookId=${encodeURIComponent(textbook.id)}`}
                    className="block bg-card border border-border rounded-xl p-4 space-y-3 transition-all hover:bg-[var(--card-hover)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    aria-label={`${textbook.name} 진도 기록하기`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <TextbookCover
                          coverImageUrl={textbook.cover_image_url}
                          title={textbook.name}
                          subjectColor={group.color}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate">{textbook.name}</p>
                          <p className="text-sm text-muted">
                            {textbook.current_page}/{textbook.total_pages}p
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-sm font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: textbook.is_completed ? '#10B98120' : `${group.color}18`,
                          color: textbook.is_completed ? '#059669' : group.color,
                        }}
                      >
                        {textbook.is_completed ? '완료' : `${textbook.progress_percent}%`}
                      </span>
                    </div>

                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${textbook.progress_percent}%`,
                          backgroundColor: textbook.is_completed ? '#10B981' : group.color,
                        }}
                      />
                    </div>

                    {textbook.curriculum_type === 'year' && textbook.school_progress && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{textbook.school_progress.current_semester}학기 수업 진도</span>
                          <span>
                            {textbook.school_progress.current_pages}/
                            {textbook.school_progress.target_pages}p ·
                            {textbook.school_progress.progress_percent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${textbook.school_progress.progress_percent}%`,
                              backgroundColor: group.color,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {textbook.sections && textbook.sections.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {textbook.sections.map((section) => (
                          <div key={section.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted">
                              <span>{section.name}</span>
                              <span>{section.current_page}/{section.total_pages}p · {section.progress_percent}%</span>
                            </div>
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${section.progress_percent}%`,
                                  backgroundColor: section.is_completed ? '#10B981' : group.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <Link
            href="/record"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-medium"
          >
            <Plus className="w-4 h-4" />
            새 진도 기록하기
          </Link>
        </div>
      )}
    </div>
  );
}
