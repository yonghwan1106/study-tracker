import { BookOpen } from 'lucide-react';

type CoverSize = 'xs' | 'sm' | 'md' | 'lg';

interface TextbookCoverProps {
  coverImageUrl?: string | null;
  title?: string;
  subjectColor?: string;
  size?: CoverSize;
  className?: string;
}

const sizeClass: Record<CoverSize, string> = {
  xs: 'h-9 w-7 rounded-lg',
  sm: 'h-12 w-9 rounded-xl',
  md: 'h-16 w-12 rounded-2xl',
  lg: 'h-24 w-[72px] rounded-2xl',
};

const iconSize: Record<CoverSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export default function TextbookCover({
  coverImageUrl,
  title,
  subjectColor = '#8b9aaa',
  size = 'sm',
  className = '',
}: TextbookCoverProps) {
  return (
    <div
      aria-label={title ? `${title} 표지` : '교재 표지'}
      className={`${sizeClass[size]} flex-shrink-0 overflow-hidden border border-white/60 shadow-sm ${className}`}
      style={{
        background: coverImageUrl ? undefined : `${subjectColor}18`,
        backgroundImage: coverImageUrl ? `url("${coverImageUrl}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!coverImageUrl && (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className={iconSize[size]} style={{ color: subjectColor }} />
        </div>
      )}
    </div>
  );
}
