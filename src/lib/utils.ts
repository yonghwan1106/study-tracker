import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${mins}분`;
}

export function formatDate(date: string | Date, formatStr: string = 'M월 d일'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ko });
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy년 M월 d일 (EEEE)', { locale: ko });
}

export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
