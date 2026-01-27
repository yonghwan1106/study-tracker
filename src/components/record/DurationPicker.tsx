'use client';

import { Minus, Plus } from 'lucide-react';

interface DurationPickerProps {
  value: number; // minutes
  onChange: (minutes: number) => void;
}

const QUICK_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function DurationPicker({ value, onChange }: DurationPickerProps) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const adjustTime = (amount: number) => {
    const newValue = Math.max(5, value + amount);
    onChange(newValue);
  };

  const setHours = (h: number) => {
    onChange(h * 60 + minutes);
  };

  const setMinutes = (m: number) => {
    onChange(hours * 60 + m);
  };

  return (
    <div className="space-y-4">
      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((mins) => (
          <button
            key={mins}
            type="button"
            onClick={() => onChange(mins)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === mins
                ? 'bg-primary text-white'
                : 'bg-card border border-border hover:bg-background'
            }`}
          >
            {mins >= 60 ? `${mins / 60}시간` : `${mins}분`}
          </button>
        ))}
      </div>

      {/* Manual adjustment */}
      <div className="flex items-center justify-center gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <label className="text-xs text-muted">시간</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHours(Math.max(0, hours - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-border transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-xl font-semibold">{hours}</span>
            <button
              type="button"
              onClick={() => setHours(hours + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-border transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <span className="text-2xl text-muted">:</span>

        <div className="flex flex-col items-center gap-2">
          <label className="text-xs text-muted">분</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMinutes(Math.max(0, minutes - 5))}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-border transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-xl font-semibold">{String(minutes).padStart(2, '0')}</span>
            <button
              type="button"
              onClick={() => setMinutes((minutes + 5) % 60)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-border transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="ml-4 text-lg font-medium text-primary">
          {hours > 0 ? `${hours}시간 ` : ''}{minutes > 0 ? `${minutes}분` : hours > 0 ? '' : '0분'}
        </div>
      </div>

      {/* Fine adjustment */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => adjustTime(-5)}
          className="px-3 py-1 text-sm bg-card border border-border rounded hover:bg-background transition-colors"
        >
          -5분
        </button>
        <button
          type="button"
          onClick={() => adjustTime(5)}
          className="px-3 py-1 text-sm bg-card border border-border rounded hover:bg-background transition-colors"
        >
          +5분
        </button>
        <button
          type="button"
          onClick={() => adjustTime(15)}
          className="px-3 py-1 text-sm bg-card border border-border rounded hover:bg-background transition-colors"
        >
          +15분
        </button>
      </div>
    </div>
  );
}
