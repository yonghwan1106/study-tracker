'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Subject, StudyRecord, Textbook } from '@/types/database';
import { useStudent } from '@/components/layout/StudentContext';
import TextbookCover from '@/components/textbooks/TextbookCover';
import {
  createStudyRecord,
  createTextbook,
  getSubjects,
  getTextbooks,
  updateTextbook,
  updateStudyRecord,
} from '@/lib/api';
import { compressTextbookCover } from '@/lib/clientImages';
import { getToday } from '@/lib/utils';
import SubjectSelect from './SubjectSelect';

interface RecordFormProps {
  editRecord?: StudyRecord;
  onSuccess?: () => void;
}

const NEW_TEXTBOOK = '__new__';

interface SectionDraft {
  name: string;
  totalPages: string;
}

function toNumber(value: string) {
  if (value.trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatProgress(page: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((page / total) * 1000) / 10);
}

export default function RecordForm({ editRecord, onSuccess }: RecordFormProps) {
  const router = useRouter();
  const { selectedStudent } = useStudent();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [subjectId, setSubjectId] = useState(editRecord?.subject_id || '');
  const [studyDate, setStudyDate] = useState(editRecord?.study_date || getToday());
  const [textbookId, setTextbookId] = useState(editRecord?.textbook_id || NEW_TEXTBOOK);
  const [textbookSectionId, setTextbookSectionId] = useState(editRecord?.textbook_section_id || '');
  const [newTextbookName, setNewTextbookName] = useState('');
  const [newCoverImageUrl, setNewCoverImageUrl] = useState('');
  const [coverProcessing, setCoverProcessing] = useState(false);
  const [newSections, setNewSections] = useState<SectionDraft[]>([
    { name: '본책', totalPages: '' },
  ]);
  const [newSectionIndex, setNewSectionIndex] = useState(0);
  const [startPage, setStartPage] = useState(
    editRecord?.start_page !== null && editRecord?.start_page !== undefined
      ? String(editRecord.start_page)
      : ''
  );
  const [endPage, setEndPage] = useState(editRecord?.end_page ? String(editRecord.end_page) : '');
  const [duration, setDuration] = useState(
    editRecord?.duration_minutes ? String(editRecord.duration_minutes) : ''
  );
  const [memo, setMemo] = useState(editRecord?.memo || '');

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const [subjectsData, textbooksData] = await Promise.all([
          getSubjects(),
          getTextbooks(selectedStudent.id),
        ]);
        setSubjects(subjectsData);
        setTextbooks(textbooksData);

        if (!editRecord && subjectsData.length > 0) {
          setSubjectId(subjectsData[0].id);
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('입력 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [editRecord, selectedStudent]);

  const subjectTextbooks = useMemo(
    () => textbooks.filter((textbook) => textbook.subject_id === subjectId),
    [subjectId, textbooks]
  );

  const selectedTextbook = subjectTextbooks.find((textbook) => textbook.id === textbookId) ?? null;
  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? null;
  const isNewTextbook = textbookId === NEW_TEXTBOOK;
  const selectedSection = selectedTextbook?.sections?.find((section) => section.id === textbookSectionId)
    ?? selectedTextbook?.sections?.[0]
    ?? null;
  const newSelectedSection = newSections[newSectionIndex] ?? newSections[0];

  useEffect(() => {
    if (editRecord || !subjectId) return;

    const firstTextbook = textbooks.find((textbook) => textbook.subject_id === subjectId);
    setTextbookId(firstTextbook?.id ?? NEW_TEXTBOOK);
    setTextbookSectionId(firstTextbook?.sections?.[0]?.id ?? '');
  }, [editRecord, subjectId, textbooks]);

  useEffect(() => {
    if (editRecord || !selectedSection || startPage !== '') return;

    const nextStart = Math.min(selectedSection.current_page + 1, selectedSection.total_pages);
    setStartPage(String(nextStart || 1));
  }, [editRecord, selectedSection, startPage]);

  const activeTotalPages = selectedSection?.total_pages ?? toNumber(newSelectedSection?.totalPages ?? '') ?? 0;
  const startPageNumber = toNumber(startPage);
  const endPageNumber = toNumber(endPage);
  const pagesDone =
    startPageNumber !== null && endPageNumber !== null && endPageNumber >= startPageNumber
      ? endPageNumber - startPageNumber + 1
      : null;
  const previewProgress =
    endPageNumber !== null && activeTotalPages > 0
      ? formatProgress(endPageNumber, activeTotalPages)
      : null;

  const updateTextbookInState = (updatedTextbook: Textbook) => {
    setTextbooks((current) =>
      current.map((textbook) =>
        textbook.id === updatedTextbook.id ? updatedTextbook : textbook
      )
    );
  };

  const handleNewCoverChange = async (file: File | null) => {
    if (!file) return;

    setCoverProcessing(true);
    setError(null);
    try {
      setNewCoverImageUrl(await compressTextbookCover(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : '표지 이미지를 처리하지 못했습니다.');
    } finally {
      setCoverProcessing(false);
    }
  };

  const handleExistingCoverChange = async (file: File | null) => {
    if (!file || !selectedTextbook) return;

    setCoverProcessing(true);
    setError(null);
    try {
      const coverImageUrl = await compressTextbookCover(file);
      const updatedTextbook = await updateTextbook(selectedTextbook.id, {
        cover_image_url: coverImageUrl,
      });
      updateTextbookInState(updatedTextbook);
    } catch (err) {
      setError(err instanceof Error ? err.message : '표지 이미지를 저장하지 못했습니다.');
    } finally {
      setCoverProcessing(false);
    }
  };

  const handleExistingCoverRemove = async () => {
    if (!selectedTextbook) return;

    setCoverProcessing(true);
    setError(null);
    try {
      const updatedTextbook = await updateTextbook(selectedTextbook.id, {
        cover_image_url: null,
      });
      updateTextbookInState(updatedTextbook);
    } catch (err) {
      setError(err instanceof Error ? err.message : '표지 이미지를 제거하지 못했습니다.');
    } finally {
      setCoverProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      setError('학생을 선택해주세요.');
      return;
    }

    if (!subjectId) {
      setError('과목을 선택해주세요.');
      return;
    }

    const end = toNumber(endPage);
    const start = toNumber(startPage);
    const durationMinutes = toNumber(duration);

    if (!end || end <= 0) {
      setError('오늘 완료한 페이지를 입력해주세요.');
      return;
    }

    if (start !== null && start > end) {
      setError('시작 페이지는 완료 페이지보다 클 수 없습니다.');
      return;
    }

    if (duration.trim() !== '' && (!durationMinutes || durationMinutes <= 0)) {
      setError('학습 시간은 비워두거나 1분 이상으로 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let textbookForRecord = selectedTextbook;
      let sectionForRecord = selectedSection;

      if (isNewTextbook) {
        const sections = newSections
          .map((section) => ({
            name: section.name.trim(),
            total_pages: toNumber(section.totalPages) ?? 0,
          }))
          .filter((section) => section.name || section.total_pages > 0);

        if (!newTextbookName.trim()) {
          setError('새 교재명을 입력해주세요.');
          setSaving(false);
          return;
        }

        if (sections.length === 0 || sections.some((section) => !section.name || section.total_pages <= 0)) {
          setError('각 구성의 이름과 총 페이지를 입력해주세요.');
          setSaving(false);
          return;
        }

        textbookForRecord = await createTextbook({
          student_id: selectedStudent.id,
          subject_id: subjectId,
          name: newTextbookName,
          cover_image_url: newCoverImageUrl || null,
          sections,
        });
        sectionForRecord = textbookForRecord.sections?.[Math.min(newSectionIndex, sections.length - 1)]
          ?? textbookForRecord.sections?.[0]
          ?? null;
      }

      if (!textbookForRecord) {
        setError('기록할 교재를 선택해주세요.');
        setSaving(false);
        return;
      }

      if (!sectionForRecord) {
        setError('기록할 교재 구성을 선택해주세요.');
        setSaving(false);
        return;
      }

      if (end > sectionForRecord.total_pages) {
        setError(`완료 페이지는 ${sectionForRecord.name}의 총 ${sectionForRecord.total_pages}페이지를 넘을 수 없습니다.`);
        setSaving(false);
        return;
      }

      const recordData = {
        student_id: selectedStudent.id,
        textbook_id: textbookForRecord.id,
        textbook_section_id: sectionForRecord.id,
        study_date: studyDate,
        start_page: start,
        end_page: end,
        duration_minutes: durationMinutes,
        memo: memo || null,
      };

      if (editRecord) {
        await updateStudyRecord(editRecord.id, recordData);
      } else {
        await createStudyRecord(recordData);
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/');
        }
      }, 1000);
    } catch (err) {
      console.error('Error saving record:', err);
      setError(err instanceof Error ? err.message : '저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--muted)]">불러오는 중...</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="glass-card p-10 text-center animate-fade-in-up">
        <span className="text-6xl block mb-4 animate-celebrate">🎉</span>
        <h2 className="text-xl font-bold mb-2">저장 완료!</h2>
        <p className="text-[var(--muted)]">교재 진도가 업데이트되었어요</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="glass-card p-4 text-center animate-fade-in-up" style={{ borderColor: '#ef444450' }}>
          <span className="text-2xl block mb-2">😥</span>
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}

      <div className="glass-card p-5 space-y-3 animate-fade-in-up">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>📅</span>
          날짜
        </label>
        <input
          type="date"
          value={studyDate}
          onChange={(e) => setStudyDate(e.target.value)}
          max={getToday()}
          className="w-full"
        />
      </div>

      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-1">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>📚</span>
          과목
        </label>
        <SubjectSelect
          subjects={subjects}
          value={subjectId}
          onChange={(value) => {
            setSubjectId(value);
            setStartPage('');
            setEndPage('');
          }}
        />
      </div>

      <div className="glass-card p-5 space-y-4 animate-fade-in-up stagger-2">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>📖</span>
          교재
        </label>

        <select
          value={textbookId}
          onChange={(e) => {
            const nextTextbookId = e.target.value;
            const nextTextbook = subjectTextbooks.find((textbook) => textbook.id === nextTextbookId);
            setTextbookId(nextTextbookId);
            setTextbookSectionId(nextTextbook?.sections?.[0]?.id ?? '');
            setStartPage('');
            setEndPage('');
          }}
          className="w-full"
        >
          {subjectTextbooks.map((textbook) => (
            <option key={textbook.id} value={textbook.id}>
              {textbook.name} ({textbook.current_page}/{textbook.total_pages}p)
            </option>
          ))}
          <option value={NEW_TEXTBOOK}>+ 새 교재 등록</option>
        </select>

        {isNewTextbook ? (
          <div className="space-y-4">
            <input
              type="text"
              value={newTextbookName}
              onChange={(e) => setNewTextbookName(e.target.value)}
              placeholder="교재명 입력"
              className="w-full"
            />

            <div className="rounded-2xl border border-dashed border-[var(--border)] p-4">
              <div className="flex items-center gap-4">
                <TextbookCover
                  coverImageUrl={newCoverImageUrl}
                  title={newTextbookName || '새 교재'}
                  subjectColor={selectedSubject?.color}
                  size="lg"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-bold">표지 사진</p>
                    <p className="text-xs text-[var(--muted)]">
                      사진은 작게 압축해서 교재와 함께 저장됩니다
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-xs font-bold text-white"
                      style={{ background: selectedSubject?.color ?? 'var(--primary)' }}>
                      {coverProcessing ? '처리 중...' : '사진 선택'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={coverProcessing}
                        onChange={(e) => {
                          handleNewCoverChange(e.target.files?.[0] ?? null);
                          e.currentTarget.value = '';
                        }}
                        className="sr-only"
                      />
                    </label>
                    {newCoverImageUrl && (
                      <button
                        type="button"
                        onClick={() => setNewCoverImageUrl('')}
                        className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted)]"
                      >
                        표지 제거
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">교재 구성</span>
                <button
                  type="button"
                  onClick={() => {
                    const hasWorkbook = newSections.some((section) => section.name === '워크북');
                    setNewSections([
                      ...newSections,
                      { name: hasWorkbook ? `구성 ${newSections.length + 1}` : '워크북', totalPages: '' },
                    ]);
                    setNewSectionIndex(newSections.length);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                >
                  + 구성 추가
                </button>
              </div>

              {newSections.map((section, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => {
                      const next = [...newSections];
                      next[index] = { ...next[index], name: e.target.value };
                      setNewSections(next);
                    }}
                    placeholder="예: 본책"
                    className="w-full"
                  />
                  <input
                    type="number"
                    min={1}
                    value={section.totalPages}
                    onChange={(e) => {
                      const next = [...newSections];
                      next[index] = { ...next[index], totalPages: e.target.value };
                      setNewSections(next);
                    }}
                    placeholder="총 페이지"
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = newSections.filter((_, sectionIndex) => sectionIndex !== index);
                      setNewSections(next.length > 0 ? next : [{ name: '본책', totalPages: '' }]);
                      setNewSectionIndex(0);
                    }}
                    disabled={newSections.length === 1}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] disabled:opacity-40"
                  >
                    삭제
                  </button>
                </div>
              ))}

              {newSections.length > 1 && (
                <div className="space-y-2">
                  <span className="text-xs text-[var(--muted)]">오늘 기록할 구성</span>
                  <select
                    value={newSectionIndex}
                    onChange={(e) => {
                      setNewSectionIndex(Number(e.target.value));
                      setStartPage('');
                      setEndPage('');
                    }}
                    className="w-full"
                  >
                    {newSections.map((section, index) => (
                      <option key={index} value={index}>
                        {section.name || `구성 ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : selectedTextbook ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: `${selectedSubject?.color ?? '#8b9aaa'}10` }}>
              <TextbookCover
                coverImageUrl={selectedTextbook.cover_image_url}
                title={selectedTextbook.name}
                subjectColor={selectedSubject?.color}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-bold truncate">{selectedTextbook.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {selectedTextbook.current_page}/{selectedTextbook.total_pages}p · {selectedTextbook.progress_percent}%
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-[var(--border)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">교재 표지</p>
                  <p className="text-xs text-[var(--muted)]">
                    기존 교재도 표지를 추가하거나 바꿀 수 있어요
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap justify-end gap-2">
                  <label
                    className="inline-flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-xs font-bold text-white"
                    style={{ background: selectedSubject?.color ?? 'var(--primary)' }}
                  >
                    {coverProcessing ? '처리 중...' : selectedTextbook.cover_image_url ? '사진 교체' : '사진 추가'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={coverProcessing}
                      onChange={(e) => {
                        handleExistingCoverChange(e.target.files?.[0] ?? null);
                        e.currentTarget.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>
                  {selectedTextbook.cover_image_url && (
                    <button
                      type="button"
                      onClick={handleExistingCoverRemove}
                      disabled={coverProcessing}
                      className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted)] disabled:opacity-50"
                    >
                      표지 제거
                    </button>
                  )}
                </div>
              </div>
            </div>

            {selectedTextbook.sections && selectedTextbook.sections.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs text-[var(--muted)]">기록할 구성</span>
                <select
                  value={selectedSection?.id ?? ''}
                  onChange={(e) => {
                    setTextbookSectionId(e.target.value);
                    setStartPage('');
                    setEndPage('');
                  }}
                  className="w-full"
                >
                  {selectedTextbook.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name} ({section.current_page}/{section.total_pages}p)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">전체 진도</span>
              <span className="font-bold">
                {selectedTextbook.current_page}/{selectedTextbook.total_pages}p · {selectedTextbook.progress_percent}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${selectedTextbook.progress_percent}%`,
                  background: selectedSubject?.color,
                }}
              />
            </div>

            {selectedSection && (
              <div className="rounded-2xl p-3 space-y-2" style={{ background: `${selectedSubject?.color ?? '#8b9aaa'}10` }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{selectedSection.name}</span>
                  <span className="font-bold">
                    {selectedSection.current_page}/{selectedSection.total_pages}p · {selectedSection.progress_percent}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${selectedSection.progress_percent}%`,
                      background: selectedSubject?.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="glass-card p-5 space-y-4 animate-fade-in-up stagger-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>📝</span>
          오늘 진도
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <span className="text-xs text-[var(--muted)]">시작 페이지</span>
            <input
              type="number"
              min={0}
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              placeholder="예: 1"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-[var(--muted)]">완료 페이지</span>
            <input
              type="number"
              min={1}
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder="예: 18"
              className="w-full"
            />
          </div>
        </div>

        {previewProgress !== null && activeTotalPages > 0 && (
          <div className="rounded-2xl p-4 space-y-2" style={{ background: `${selectedSubject?.color ?? '#8b9aaa'}12` }}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">저장 후 예상 진도</span>
              <span className="font-bold" style={{ color: selectedSubject?.color }}>
                {isNewTextbook ? newSelectedSection?.name : selectedSection?.name} {endPageNumber}/{activeTotalPages}p · {previewProgress}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${previewProgress}%`,
                  background: selectedSubject?.color,
                }}
              />
            </div>
            {pagesDone !== null && (
              <p className="text-xs text-[var(--muted)]">오늘 기록될 분량: {pagesDone}페이지</p>
            )}
          </div>
        )}
      </div>

      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-4">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>⏱️</span>
          학습 시간 <span className="font-normal text-[var(--muted)]">(선택)</span>
        </label>
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="분 단위로 입력"
          className="w-full"
        />
      </div>

      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-5">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>💬</span>
          메모 <span className="font-normal text-[var(--muted)]">(선택)</span>
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="오답, 단원명, 부모님 코멘트를 남겨요"
          rows={3}
          className="w-full resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving || coverProcessing || !selectedStudent}
        className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        style={{
          background: selectedSubject
            ? `linear-gradient(135deg, ${selectedSubject.color} 0%, ${selectedSubject.color}dd 100%)`
            : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          boxShadow: selectedSubject
            ? `0 8px 30px ${selectedSubject.color}40`
            : '0 8px 30px var(--primary-glow)',
        }}
      >
        {saving || coverProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {coverProcessing ? '표지 처리 중...' : '저장 중...'}
          </>
        ) : (
          <>
            <span className="text-xl">✨</span>
            {editRecord ? '진도 수정하기' : '진도 저장하기'}
          </>
        )}
      </button>
    </form>
  );
}
