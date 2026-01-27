'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { StudyRecord } from '@/types/database';
import RecordForm from '@/components/record/RecordForm';
import { useStudent } from '@/components/layout/StudentContext';

export default function EditRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedStudent } = useStudent();
  const [record, setRecord] = useState<StudyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      if (!params.id) return;

      try {
        const { data, error } = await supabase
          .from('st_study_records')
          .select('*, subject:st_subjects(*)')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setRecord(data);
      } catch (err) {
        console.error('Error loading record:', err);
        setError('기록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--muted)]">불러오는 중...</span>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="glass-card p-8 text-center">
        <span className="text-5xl block mb-4">😥</span>
        <p className="text-[var(--muted)] mb-4">{error || '기록을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 rounded-full text-sm font-medium bg-[var(--primary)] text-white"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 text-center animate-fade-in-up">
        <span className="text-4xl mb-2 block">✏️</span>
        <h1 className="text-xl font-bold">학습 기록 수정</h1>
        <p className="text-[var(--muted)] text-sm mt-1">기록을 수정해요</p>
      </div>

      <RecordForm
        editRecord={record}
        onSuccess={() => router.push('/history')}
      />
    </div>
  );
}
