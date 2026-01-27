'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Subject, StudyRecord } from '@/types/database';
import { useStudent } from '@/components/layout/StudentContext';
import { getSubjects, createStudyRecord, updateStudyRecord } from '@/lib/api';
import { getToday } from '@/lib/utils';
import SubjectSelect from './SubjectSelect';
import DurationPicker from './DurationPicker';
import TextbookInput from './TextbookInput';

interface RecordFormProps {
  editRecord?: StudyRecord;
  onSuccess?: () => void;
}

export default function RecordForm({ editRecord, onSuccess }: RecordFormProps) {
  const router = useRouter();
  const { selectedStudent } = useStudent();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [subjectId, setSubjectId] = useState(editRecord?.subject_id || '');
  const [studyDate, setStudyDate] = useState(editRecord?.study_date || getToday());
  const [textbook, setTextbook] = useState(editRecord?.textbook || '');
  const [studyRange, setStudyRange] = useState(editRecord?.study_range || '');
  const [duration, setDuration] = useState(editRecord?.duration_minutes || 30);
  const [memo, setMemo] = useState(editRecord?.memo || '');

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getSubjects();
        setSubjects(data);
        if (!editRecord && data.length > 0) {
          setSubjectId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
        setError('과목을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, [editRecord]);

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

    if (duration <= 0) {
      setError('학습 시간을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const recordData = {
        student_id: selectedStudent.id,
        subject_id: subjectId,
        study_date: studyDate,
        textbook: textbook || undefined,
        study_range: studyRange || undefined,
        duration_minutes: duration,
        memo: memo || undefined,
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
      }, 1500);
    } catch (err) {
      console.error('Error saving record:', err);
      setError('저장에 실패했습니다. 다시 시도해주세요.');
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
        <p className="text-[var(--muted)]">학습 기록이 저장되었어요</p>
      </div>
    );
  }

  const selectedSubject = subjects.find(s => s.id === subjectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="glass-card p-4 text-center animate-fade-in-up" style={{ borderColor: '#ef444450' }}>
          <span className="text-2xl block mb-2">😥</span>
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Date */}
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

      {/* Subject */}
      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-1">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>📚</span>
          과목 선택
        </label>
        <SubjectSelect
          subjects={subjects}
          value={subjectId}
          onChange={setSubjectId}
        />
      </div>

      {/* Textbook */}
      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-2">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>📖</span>
          교재명
        </label>
        <TextbookInput
          subjectId={subjectId}
          value={textbook}
          onChange={setTextbook}
        />
      </div>

      {/* Study Range */}
      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>📝</span>
          학습 범위
        </label>
        <input
          type="text"
          value={studyRange}
          onChange={(e) => setStudyRange(e.target.value)}
          placeholder="예: 2단원 p.35~42"
          className="w-full"
        />
      </div>

      {/* Duration */}
      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-4">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>⏱️</span>
          학습 시간
        </label>
        <DurationPicker value={duration} onChange={setDuration} />
      </div>

      {/* Memo */}
      <div className="glass-card p-5 space-y-3 animate-fade-in-up stagger-5">
        <label className="flex items-center gap-2 text-sm font-bold">
          <span>💬</span>
          메모 <span className="font-normal text-[var(--muted)]">(선택)</span>
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="부모님 코멘트나 피드백을 입력하세요"
          rows={3}
          className="w-full resize-none"
        />
      </div>

      {/* Submit */}
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
            {editRecord ? '수정 완료' : '기록 저장하기'}
          </>
        )}
      </button>
    </form>
  );
}
