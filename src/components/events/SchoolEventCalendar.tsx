'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useStudent } from '@/components/layout/StudentContext';
import {
  createSchoolEvent,
  deleteSchoolEvent,
  getSchoolEvents,
  getSubjects,
  updateSchoolEvent,
} from '@/lib/api';
import {
  getEventDateLabel,
  getSchoolEventColor,
  getSchoolEventType,
  schoolEventTypes,
} from '@/lib/events';
import { getToday } from '@/lib/utils';
import { SchoolEvent, SchoolEventType, Subject } from '@/types/database';

interface EventFormState {
  title: string;
  eventType: SchoolEventType;
  subjectId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  memo: string;
}

const emptyForm = (date = getToday()): EventFormState => ({
  title: '',
  eventType: 'performance',
  subjectId: '',
  startDate: date,
  endDate: date,
  startTime: '',
  memo: '',
});

function subjectEmoji(name?: string) {
  if (name === '영어') return '🔤';
  if (name === '수학') return '🔢';
  if (name === '국어') return '📝';
  if (name === '사회') return '🌍';
  if (name === '과학') return '🔬';
  return '📌';
}

function dayHasEvent(dayKey: string, event: SchoolEvent) {
  return event.start_date <= dayKey && event.end_date >= dayKey;
}

export default function SchoolEventCalendar() {
  const { selectedStudent } = useStudent();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [form, setForm] = useState<EventFormState | null>(null);

  const { calendarStart, calendarEnd, calendarDays } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return {
      calendarStart: start,
      calendarEnd: end,
      calendarDays: eachDayOfInterval({ start, end }),
    };
  }, [currentMonth]);

  const calendarStartKey = format(calendarStart, 'yyyy-MM-dd');
  const calendarEndKey = format(calendarEnd, 'yyyy-MM-dd');

  const loadData = useCallback(async () => {
    if (!selectedStudent) return;

    setLoading(true);
    setError(null);
    try {
      const [subjectData, eventData] = await Promise.all([
        getSubjects(),
        getSchoolEvents(
          selectedStudent.id,
          calendarStartKey,
          calendarEndKey
        ),
      ]);
      setSubjects(subjectData);
      setEvents(eventData);
    } catch (err) {
      console.error('Error loading school events:', err);
      setError('학사 일정을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [calendarEndKey, calendarStartKey, selectedStudent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEvents = useMemo(
    () => events.filter((event) => dayHasEvent(selectedDate, event)),
    [events, selectedDate]
  );

  const upcomingEvents = useMemo(
    () => events
      .filter((event) => event.end_date >= getToday())
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 4),
    [events]
  );

  const openCreate = (date = selectedDate) => {
    setEditingEvent(null);
    setForm(emptyForm(date));
    setError(null);
  };

  const openEdit = (event: SchoolEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      eventType: event.event_type,
      subjectId: event.subject_id ?? '',
      startDate: event.start_date,
      endDate: event.end_date,
      startTime: event.start_time ?? '',
      memo: event.memo ?? '',
    });
    setError(null);
  };

  const closeForm = () => {
    setForm(null);
    setEditingEvent(null);
    setError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedStudent || !form) return;

    if (!form.title.trim()) {
      setError('일정 제목을 입력해주세요.');
      return;
    }

    if (form.endDate < form.startDate) {
      setError('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        subject_id: form.subjectId || null,
        event_type: form.eventType,
        title: form.title.trim(),
        start_date: form.startDate,
        end_date: form.endDate,
        start_time: form.startTime || null,
        memo: form.memo.trim() || null,
      };

      if (editingEvent) {
        await updateSchoolEvent(editingEvent.id, payload);
      } else {
        await createSchoolEvent({
          student_id: selectedStudent.id,
          ...payload,
        });
      }

      setSelectedDate(form.startDate);
      closeForm();
      await loadData();
    } catch (err) {
      console.error('Error saving school event:', err);
      setError(err instanceof Error ? err.message : '일정을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;

    setSaving(true);
    setError(null);
    try {
      await deleteSchoolEvent(editingEvent.id);
      closeForm();
      await loadData();
    } catch (err) {
      console.error('Error deleting school event:', err);
      setError(err instanceof Error ? err.message : '일정을 삭제하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className="space-y-5">
      <section className="glass-card p-5 animate-fade-in-up overflow-hidden relative">
        <div className="absolute -right-8 -top-8 text-[120px] opacity-[0.05] pointer-events-none select-none">
          📅
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[var(--primary)]">School Calendar</p>
            <h1 className="text-2xl font-bold">학사 일정</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              시험과 수행평가를 한 달 달력으로 봅니다
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreate()}
            className="btn btn-primary px-4 py-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
      </section>

      {upcomingEvents.length > 0 && (
        <section className="glass-card p-4 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="font-bold">다가오는 일정</h2>
          </div>
          <div className="grid gap-2">
            {upcomingEvents.map((event) => {
              const color = getSchoolEventColor(event);
              const type = getSchoolEventType(event.event_type);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEdit(event)}
                  className="rounded-2xl p-3 text-left transition-all hover:translate-y-[-1px]"
                  style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{event.title}</p>
                      <p className="text-xs text-[var(--muted)] truncate">
                        {event.subject?.name ? `${event.subject.name} · ` : ''}{type.label} · {getEventDateLabel(event)}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{ background: `${color}18`, color }}
                    >
                      {type.shortLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="glass-card p-4 animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-[var(--background)] transition-colors"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-[var(--background)] transition-colors"
            aria-label="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-xs font-bold py-2 ${
                    index === 5 ? 'text-blue-500' : index === 6 ? 'text-red-500' : 'text-[var(--muted)]'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = events.filter((event) => dayHasEvent(dayKey, event));
                const isSelected = selectedDate === dayKey;
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDate(dayKey)}
                    onDoubleClick={() => openCreate(dayKey)}
                    className="min-h-[78px] rounded-xl p-1.5 text-left transition-all border flex flex-col gap-1"
                    style={{
                      background: isSelected ? 'var(--card-hover)' : 'var(--card)',
                      borderColor: isSelected
                        ? 'var(--primary)'
                        : isToday
                          ? 'var(--primary-light)'
                          : 'var(--border)',
                      opacity: isSameMonth(day, currentMonth) ? 1 : 0.38,
                      boxShadow: isSelected ? '0 0 0 3px var(--primary-glow)' : 'none',
                    }}
                  >
                    <span
                      className={`text-xs font-bold ${isToday ? 'text-[var(--primary)]' : ''}`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-1 min-w-0">
                      {dayEvents.slice(0, 2).map((event) => {
                        const color = getSchoolEventColor(event);
                        return (
                          <span
                            key={event.id}
                            className="block rounded-md px-1.5 py-0.5 text-[10px] font-bold truncate"
                            style={{ background: `${color}18`, color }}
                          >
                            {event.subject?.name ? subjectEmoji(event.subject.name) : ''} {event.title}
                          </span>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="block text-[10px] text-[var(--muted)]">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="glass-card p-4 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-[var(--muted)]">
              {format(parseISO(selectedDate), 'M월 d일 EEEE', { locale: ko })}
            </p>
            <h2 className="font-bold">선택한 날짜</h2>
          </div>
          <button
            type="button"
            onClick={() => openCreate(selectedDate)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            <CalendarPlus className="w-4 h-4" />
            추가
          </button>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
            <p className="text-sm text-[var(--muted)]">등록된 일정이 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((event) => {
              const color = getSchoolEventColor(event);
              const type = getSchoolEventType(event.event_type);
              return (
                <div
                  key={event.id}
                  className="rounded-2xl p-3 flex items-start gap-3"
                  style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                >
                  <div
                    className="mt-1 h-3 w-3 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: `${color}18`, color }}
                      >
                        {event.subject?.name ?? type.label}
                      </span>
                      {event.start_time && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                          <Clock className="w-3 h-3" />
                          {event.start_time}
                        </span>
                      )}
                    </div>
                    <p className="font-bold mt-1 truncate">{event.title}</p>
                    <p className="text-xs text-[var(--muted)]">{getEventDateLabel(event)}</p>
                    {event.memo && (
                      <p className="text-sm text-[var(--foreground-soft)] mt-1 line-clamp-2">
                        {event.memo}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(event)}
                    className="p-2 rounded-xl hover:bg-white/60 transition-colors"
                    aria-label="일정 수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {form && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold">
                {editingEvent ? '일정 수정' : '일정 추가'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="p-2 rounded-xl hover:bg-[var(--background)] transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value as SchoolEventType })}
                  className="w-full"
                >
                  {schoolEventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full"
                >
                  <option value="">과목 없음</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 수학 중간고사, 영어 말하기 수행평가"
                className="w-full"
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-[var(--muted)]">시작일</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setForm({
                        ...form,
                        startDate: nextStart,
                        endDate: form.endDate < nextStart ? nextStart : form.endDate,
                      });
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[var(--muted)]">종료일</span>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full"
              />

              <textarea
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="범위, 준비물, 제출 방식 등을 적어요"
                rows={3}
                className="w-full resize-none"
              />
            </div>

            <div className="mt-5 flex gap-2">
              {editingEvent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl border border-red-500/30 px-4 py-3 text-red-500 disabled:opacity-50"
                  aria-label="삭제"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex-1 py-3 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                저장
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
