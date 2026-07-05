'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Subject, StudyRecord, Textbook } from '@/types/database';
import { useStudent } from '@/components/layout/StudentContext';
import {
  createStudyRecord,
  createTextbook,
  getSubjects,
  getTextbooks,
  updateStudyRecord,
} from '@/lib/api';
import { getToday } from '@/lib/utils';
import SubjectSelect from './SubjectSelect';

interface RecordFormProps {
  editRecord?: StudyRecord;
  onSuccess?: () => void;
}

const NEW_TEXTBOOK = '__new__';

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
  const [newTextbookName, setNewTextbookName] = useState('');
  const [totalPages, setTotalPages] = useState('');
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

  useEffect(() => {
    if (editRecord || !subjectId) return;

    const firstTextbook = textbooks.find((textbook) => textbook.subject_id === subjectId);
    setTextbookId(firstTextbook?.id ?? NEW_TEXTBOOK);
  }, [editRecord, subjectId, textbooks]);

  useEffect(() => {
    if (editRecord || !selectedTextbook || startPage !== '') return;

    const nextStart = Math.min(selectedTextbook.current_page + 1, selectedTextbook.total_pages);
    setStartPage(String(nextStart || 1));
  }, [editRecord, selectedTextbook, startPage]);

  const activeTotalPages = selectedTextbook?.total_pages ?? toNumber(totalPages) ?? 0;
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

      if (isNewTextbook) {
        const pages = toNumber(totalPages);

        if (!newTextbookName.trim()) {
          setError('새 교재명을 입력해주세요.');
          setSaving(false);
          return;
        }

        if (!pages || pages <= 0) {
          setError('새 교재의 총 페이지를 입력해주세요.');
          setSaving(false);
          return;
        }

        textbookForRecord = await createTextbook({
          student_id: selectedStudent.id,
          subject_id: subjectId,
          name: newTextbookName,
          total_pages: pages,
        });
      }

      if (!textbookForRecord) {
        setError('기록할 교재를 선택해주세요.');
        setSaving(false);
        return;
      }

      if (end > textbookForRecord.total_pages) {
        setError(`완료 페이지는 총 ${textbookForRecord.total_pages}페이지를 넘을 수 없습니다.`);
        setSaving(false);
        return;
      }

      const recordData = {
        student_id: selectedStudent.id,
        textbook_id: textbookForRecord.id,
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
            setTextbookId(e.target.value);
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
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <input
              type="text"
              value={newTextbookName}
              onChange={(e) => setNewTextbookName(e.target.value)}
              placeholder="교재명 입력"
              className="w-full"
            />
            <input
              type="number"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="총 페이지"
              className="w-full"
            />
          </div>
        ) : selectedTextbook ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">현재 진도</span>
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
                {endPageNumber}/{activeTotalPages}p · {previewProgress}%
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
        disabled={saving || !selectedStudent}
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
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            저장 중...
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
