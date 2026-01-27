'use client';

interface DurationPickerProps {
  value: number; // minutes
  onChange: (minutes: number) => void;
}

const QUICK_OPTIONS = [
  { value: 15, label: '15분', emoji: '⚡' },
  { value: 30, label: '30분', emoji: '🕐' },
  { value: 45, label: '45분', emoji: '📖' },
  { value: 60, label: '1시간', emoji: '💪' },
  { value: 90, label: '1.5시간', emoji: '🔥' },
  { value: 120, label: '2시간', emoji: '🏆' },
];

export default function DurationPicker({ value, onChange }: DurationPickerProps) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const setHours = (h: number) => {
    onChange(Math.max(0, h) * 60 + minutes);
  };

  const setMinutes = (m: number) => {
    const newMinutes = Math.max(0, Math.min(55, m));
    onChange(hours * 60 + newMinutes);
  };

  const formatDisplay = () => {
    if (hours === 0) return `${minutes}분`;
    if (minutes === 0) return `${hours}시간`;
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <div className="space-y-5">
      {/* Quick select buttons */}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className="p-3 rounded-xl text-center transition-all duration-300"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                  : 'var(--card)',
                color: isSelected ? 'white' : 'var(--foreground)',
                border: `2px solid ${isSelected ? 'transparent' : 'var(--border)'}`,
                boxShadow: isSelected ? '0 4px 15px var(--primary-glow)' : 'var(--shadow-sm)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span className="text-lg block mb-0.5">{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Manual adjustment */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-center gap-6">
          {/* Hours */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-[var(--muted)] font-medium">시간</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHours(hours - 1)}
                disabled={hours <= 0}
                className="w-10 h-10 rounded-xl bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center text-lg font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="w-12 text-center text-3xl font-bold">{hours}</span>
              <button
                type="button"
                onClick={() => setHours(hours + 1)}
                className="w-10 h-10 rounded-xl bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center text-lg font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
              >
                +
              </button>
            </div>
          </div>

          <span className="text-3xl text-[var(--muted)] font-light mt-6">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-[var(--muted)] font-medium">분</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMinutes(minutes - 5)}
                disabled={minutes <= 0 && hours <= 0}
                className="w-10 h-10 rounded-xl bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center text-lg font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="w-12 text-center text-3xl font-bold">
                {String(minutes).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setMinutes(minutes + 5)}
                className="w-10 h-10 rounded-xl bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center text-lg font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="mt-4 text-center">
          <span
            className="inline-block px-6 py-2 rounded-full text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--primary)20 0%, var(--primary)10 100%)',
              color: 'var(--primary)',
            }}
          >
            {formatDisplay()}
          </span>
        </div>
      </div>

      {/* Fine adjustment */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(5, value - 5))}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
        >
          −5분
        </button>
        <button
          type="button"
          onClick={() => onChange(value + 5)}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
        >
          +5분
        </button>
        <button
          type="button"
          onClick={() => onChange(value + 15)}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all"
        >
          +15분
        </button>
      </div>
    </div>
  );
}
