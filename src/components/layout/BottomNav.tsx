'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '홈', emoji: '🏠', activeEmoji: '🏡' },
  { href: '/record', label: '기록', emoji: '✏️', activeEmoji: '📝' },
  { href: '/calendar', label: '캘린더', emoji: '📅', activeEmoji: '🗓️' },
  { href: '/stats', label: '통계', emoji: '📊', activeEmoji: '📈' },
  { href: '/goals', label: '목표', emoji: '🎯', activeEmoji: '🏆' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50">
      {/* Blur background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[var(--card)] border-t border-[var(--card-border)]" />

      {/* Safe area padding for iOS */}
      <div className="relative flex items-center justify-around h-20 pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300"
            >
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute -top-1 w-12 h-1 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]"
                  style={{
                    boxShadow: '0 2px 10px var(--primary-glow)',
                  }}
                />
              )}

              {/* Emoji icon */}
              <span
                className={`text-2xl transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-100 grayscale opacity-60'
                }`}
                style={{
                  filter: isActive ? 'none' : 'grayscale(50%)',
                }}
              >
                {isActive ? item.activeEmoji : item.emoji}
              </span>

              {/* Label */}
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted)]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
