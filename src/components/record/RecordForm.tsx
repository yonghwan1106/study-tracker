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
import { Save, Loader2 } from 'lucide-react';

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

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/history');
      }
    } catch (err) {
      console.error('Error saving record:', err);
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedSubject = subjects.find(s => s.id === subjectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Date */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted">날짜</label>
        <input
          type="date"
          value={studyDate}
          onChange={(e) => setStudyDate(e.target.value)}
          max={getToday()}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg"
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted">과목</label>
        <SubjectSelect
          subjects={subjects}
          value={subjectId}
          onChange={setSubjectId}
        />
      </div>

      {/* Textbook */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted">교재명</label>
        <TextbookInput
          subjectId={subjectId}
          value={textbook}
          onChange={setTextbook}
        />
      </div>

      {/* Study Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted">학습 범위</label>
        <input
          type="text"
          value={studyRange}
          onChange={(e) => setStudyRange(e.target.value)}
          placeholder="예: 2단원 p.35~42"
          className="w-full px-4 py-3 bg-card border border-border rounded-lg"
        />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted">학습 시간</label>
        <DurationPicker value={duration} onChange={setDuration} />
      </div>

      {/* Memo */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted">메모 (선택)</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="부모님 코멘트나 피드백을 입력하세요"
          rows={3}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !selectedStudent}
        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: selectedSubject?.color,
        }}
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            저장 중...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            {editRecord ? '수정 완료' : '기록 저장'}
          </>
        )}
      </button>
    </form>
  );
}
