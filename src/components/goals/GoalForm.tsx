'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Textbook } from '@/types/database';
import { useStudent } from '@/components/layout/StudentContext';
import { getTextbooks } from '@/lib/api';
import { BookOpen, CheckCircle2, Loader2, Plus } from 'lucide-react';

export default function GoalForm() {
  const { selectedStudent } = useStudent();
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        setTextbooks(await getTextbooks(selectedStudent.id));
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

  return (
    <div className="space-y-6">
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
                  <div key={textbook.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold truncate">{textbook.name}</p>
                        <p className="text-sm text-muted">
                          {textbook.current_page}/{textbook.total_pages}p
                        </p>
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
                  </div>
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
