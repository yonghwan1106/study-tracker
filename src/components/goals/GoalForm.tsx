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
  updateTextbook,
} from '@/lib/api';
import { partitionTextbooksForCurrentSemester } from '@/lib/textbookVisibility';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  X,
} from 'lucide-react';

interface TextbookGroup {
  subjectName: string;
  color: string;
  textbooks: Textbook[];
}

function groupTextbooks(textbooks: Textbook[]) {
  const map = new Map<string, TextbookGroup>();

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
}

function compareTextbooks(first: Textbook, second: Textbook) {
  const subjectOrder = (first.subject?.sort_order ?? Number.MAX_SAFE_INTEGER)
    - (second.subject?.sort_order ?? Number.MAX_SAFE_INTEGER);

  if (subjectOrder !== 0) return subjectOrder;
  if (first.is_completed !== second.is_completed) return first.is_completed ? 1 : -1;
  return first.name.localeCompare(second.name, 'ko');
}

function TextbookCard({
  textbook,
  color,
  onTextbookUpdated,
}: {
  textbook: Textbook;
  color: string;
  onTextbookUpdated: (textbook: Textbook) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(textbook.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEditing = () => {
    setDraftName(textbook.name);
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (isSaving) return;
    setDraftName(textbook.name);
    setSaveError(null);
    setIsEditing(false);
  };

  const saveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const name = draftName.trim();
    if (!name) {
      setSaveError('교재명을 입력해주세요.');
      return;
    }

    if (name === textbook.name) {
      setDraftName(textbook.name);
      setSaveError(null);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const updated = await updateTextbook(textbook.id, { name });
      onTextbookUpdated(updated);
      setDraftName(updated.name);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '교재명 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="relative space-y-3 rounded-xl border border-border bg-card p-4 transition-all hover:bg-[var(--card-hover)] hover:shadow-md">
      <Link
        href={`/record?textbookId=${encodeURIComponent(textbook.id)}`}
        className="absolute inset-0 z-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        aria-label={`${textbook.name} 진도 기록하기`}
      />

      <div className="pointer-events-none relative z-20 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <TextbookCover
              coverImageUrl={textbook.cover_image_url}
              title={textbook.name}
              subjectColor={color}
              size="md"
            />
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <form
                  onSubmit={saveName}
                  className="pointer-events-auto flex min-w-0 items-center gap-1.5"
                  aria-busy={isSaving}
                >
                  <input
                    type="text"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelEditing();
                      }
                    }}
                    disabled={isSaving}
                    autoFocus
                    aria-label={`${textbook.name} 교재명`}
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm font-bold outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isSaving}
                    aria-label="교재명 저장"
                    title="교재명 저장"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-green-600 transition-colors hover:bg-green-500/10 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    aria-label="교재명 수정 취소"
                    title="교재명 수정 취소"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-background disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  aria-label={`${textbook.name} 교재명 수정`}
                  title="교재명 수정"
                  className="pointer-events-auto block max-w-full truncate rounded-sm text-left font-bold outline-none hover:text-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  {textbook.name}
                </button>
              )}
              <p className="text-sm text-muted">
                {textbook.current_page}/{textbook.total_pages}p
              </p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-sm font-bold"
            style={{
              background: textbook.is_completed ? '#10B98120' : `${color}18`,
              color: textbook.is_completed ? '#059669' : color,
            }}
          >
            {textbook.is_completed ? '완료' : `${textbook.progress_percent}%`}
          </span>
        </div>

        {saveError && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {saveError}
          </p>
        )}

        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${textbook.progress_percent}%`,
              backgroundColor: textbook.is_completed ? '#10B981' : color,
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
            <div className="h-1.5 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${textbook.school_progress.progress_percent}%`,
                  backgroundColor: color,
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
                <div className="h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${section.progress_percent}%`,
                      backgroundColor: section.is_completed ? '#10B981' : color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function TextbookGroups({
  groups,
  onTextbookUpdated,
}: {
  groups: TextbookGroup[];
  onTextbookUpdated: (textbook: Textbook) => void;
}) {
  return groups.map((group) => (
    <section key={group.subjectName} className="space-y-3">
      <h2 className="font-bold flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
        {group.subjectName}
      </h2>

      <div className="space-y-3">
        {group.textbooks.map((textbook) => (
          <TextbookCard
            key={textbook.id}
            textbook={textbook}
            color={group.color}
            onTextbookUpdated={onTextbookUpdated}
          />
        ))}
      </div>
    </section>
  ));
}

export default function GoalForm() {
  const { selectedStudent } = useStudent();
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSemester, setCurrentSemester] = useState<1 | 2>(1);
  const [semesterSaving, setSemesterSaving] = useState(false);
  const [showPreviousTextbooks, setShowPreviousTextbooks] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent) return;

      setLoading(true);
      setShowPreviousTextbooks(false);
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

  const semesterTextbooks = useMemo(() => {
    return partitionTextbooksForCurrentSemester(textbooks);
  }, [textbooks]);
  const groupedTextbooks = useMemo(
    () => groupTextbooks(semesterTextbooks.currentTextbooks),
    [semesterTextbooks.currentTextbooks]
  );
  const groupedPreviousTextbooks = useMemo(
    () => groupTextbooks(semesterTextbooks.previousTextbooks),
    [semesterTextbooks.previousTextbooks]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summaryTextbooks = semesterTextbooks.currentTextbooks;
  const completedCount = summaryTextbooks.filter((textbook) => textbook.is_completed).length;
  const averageProgress = summaryTextbooks.length > 0
    ? Math.round(summaryTextbooks.reduce((sum, textbook) => sum + textbook.progress_percent, 0) / summaryTextbooks.length)
    : 0;

  const handleSemesterChange = async (semester: 1 | 2) => {
    if (!selectedStudent || semester === currentSemester || semesterSaving) return;

    setSemesterSaving(true);
    try {
      const settings = await updateAcademicSettings(semester);
      setCurrentSemester(settings.current_semester);
      setTextbooks(await getTextbooks(selectedStudent.id));
    } catch (error) {
      console.error('Error updating academic semester:', error);
    } finally {
      setSemesterSaving(false);
    }
  };

  const handleTextbookUpdated = (updated: Textbook) => {
    setTextbooks((current) => current
      .map((textbook) => textbook.id === updated.id ? updated : textbook)
      .sort(compareTextbooks));
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
          <p className="text-2xl font-bold">{summaryTextbooks.length}</p>
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
          <TextbookGroups
            groups={groupedTextbooks}
            onTextbookUpdated={handleTextbookUpdated}
          />

          {semesterTextbooks.isArchiveActive
            && semesterTextbooks.previousTextbooks.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowPreviousTextbooks((visible) => !visible)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-muted transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                aria-expanded={showPreviousTextbooks}
              >
                {semesterTextbooks.isSecondSemester ? '1학기·기타 교재' : '1학기 교재'}{' '}
                {showPreviousTextbooks ? '접기' : '보기'}
                <span className="text-xs font-normal">
                  ({semesterTextbooks.previousTextbooks.length})
                </span>
                {showPreviousTextbooks ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showPreviousTextbooks && (
                <div className="space-y-5 border-t border-dashed border-border pt-5">
                  <h2 className="text-sm font-bold text-muted">
                    {semesterTextbooks.isSecondSemester
                      ? '지난 1학기·기타 교재'
                      : '지난 1학기 교재'}
                  </h2>
                  <TextbookGroups
                    groups={groupedPreviousTextbooks}
                    onTextbookUpdated={handleTextbookUpdated}
                  />
                </div>
              )}
            </>
          )}

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
