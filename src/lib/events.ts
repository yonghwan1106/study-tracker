import { SchoolEvent, SchoolEventType } from '@/types/database';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export const schoolEventTypes: {
  value: SchoolEventType;
  label: string;
  shortLabel: string;
  color: string;
}[] = [
  { value: 'midterm', label: '중간고사', shortLabel: '중간', color: '#ef4444' },
  { value: 'final', label: '기말고사', shortLabel: '기말', color: '#dc2626' },
  { value: 'performance', label: '수행평가', shortLabel: '수행', color: '#8b5cf6' },
  { value: 'school', label: '학교 일정', shortLabel: '학교', color: '#0ea5e9' },
  { value: 'other', label: '기타', shortLabel: '기타', color: '#64748b' },
];

export function getSchoolEventType(type: SchoolEventType) {
  return schoolEventTypes.find((item) => item.value === type) ?? schoolEventTypes[4];
}

export function getSchoolEventColor(event: SchoolEvent) {
  return event.subject?.color ?? getSchoolEventType(event.event_type).color;
}

export function getEventDateLabel(event: SchoolEvent) {
  if (event.start_date === event.end_date) {
    return event.start_date;
  }

  return `${event.start_date} ~ ${event.end_date}`;
}

export function getDaysUntilEvent(event: SchoolEvent, today = new Date()) {
  return differenceInCalendarDays(parseISO(event.start_date), today);
}

export function getDaysUntilLabel(event: SchoolEvent, today = new Date()) {
  const days = getDaysUntilEvent(event, today);

  if (days < 0) return '진행 중';
  if (days === 0) return '오늘';
  if (days === 1) return '내일';
  return `D-${days}`;
}
