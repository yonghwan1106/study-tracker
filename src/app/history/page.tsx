'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useStudent } from '@/components/layout/StudentContext';
import TextbookCover from '@/components/textbooks/TextbookCover';
import { deleteStudyRecord, getPagesDone, getStudyRecords } from '@/lib/api';
import { StudyRecord } from '@/types/database';
import { formatDateFull } from '@/lib/utils';
import { Loader2, BookOpen, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, addDays, parseISO } from 'date-fns';

export default function HistoryPage() {
  const { selectedStudent, loading: studentLoading } = useStudent();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const loadRecords = useCallback(async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const data = await getStudyRecords(selectedStudent.id, startDate, endDate);
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStudent, startDate, endDate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 진도 기록을 삭제하시겠습니까?')) return;

    try {
      await deleteStudyRecord(id);
      setRecords(records.filter((record) => record.id !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const moveDateRange = (days: number) => {
    setStartDate(format(addDays(parseISO(startDate), days), 'yyyy-MM-dd'));
    setEndDate(format(addDays(parseISO(endDate), days), 'yyyy-MM-dd'));
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">학생을 먼저 선택해주세요.</p>
      </div>
    );
  }

  const recordsByDate: Record<string, StudyRecord[]> = {};
  records.forEach((record) => {
    if (!recordsByDate[record.study_date]) {
      recordsByDate[record.study_date] = [];
    }
    recordsByDate[record.study_date].push(record);
  });

  const sortedDates = Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{selectedStudent.name}의 진도 기록</h1>
      </div>

      <div className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded-lg">
        <button
          onClick={() => moveDateRange(-7)}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          />
          <span className="text-muted">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          />
        </div>
        <button
          onClick={() => moveDateRange(7)}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">선택한 기간에 진도 기록이 없습니다</p>
          <Link href="/record" className="text-primary text-sm hover:underline mt-2 inline-block">
            진도 기록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayRecords = recordsByDate[date];
            const totalPages = dayRecords.reduce((sum, record) => sum + getPagesDone(record), 0);

            return (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{formatDateFull(date)}</h3>
                  <span className="text-sm text-primary font-medium">
                    총 {totalPages}p
                  </span>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {dayRecords.map((record) => (
                    <div key={record.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: record.subject?.color }}
                        />
                        {record.textbook && (
                          <TextbookCover
                            coverImageUrl={record.textbook.cover_image_url}
                            title={record.textbook.name}
                            subjectColor={record.subject?.color}
                            size="sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{record.subject?.name}</span>
                            <span className="text-sm text-muted">
                              +{getPagesDone(record)}p
                            </span>
                          </div>
                          <p className="text-sm text-muted mt-1">
                            {record.textbook?.name}
                            {record.round_number > 1 && ` · ${record.round_number}회독`}
                            {record.textbook_section && ` · ${record.textbook_section.name}`}
                          </p>
                          <p className="text-sm text-muted">
                            {record.start_page ?? '?'}p → {record.end_page}p
                            {record.round && ` · 회독 진도 ${record.round.progress_percent}%`}
                          </p>
                          {record.duration_minutes && (
                            <p className="text-xs text-muted mt-1">학습 시간 {record.duration_minutes}분</p>
                          )}
                          {record.memo && (
                            <p className="text-sm mt-2 p-2 bg-background rounded">
                              💬 {record.memo}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/record/edit/${record.id}`}
                            className="p-2 hover:bg-background rounded-lg transition-colors text-muted hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
