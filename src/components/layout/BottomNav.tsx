'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Calendar, BarChart3, Target } from 'lucide-react';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/record', label: '기록', icon: PlusCircle },
  { href: '/calendar', label: '캘린더', icon: Calendar },
  { href: '/stats', label: '통계', icon: BarChart3 },
  { href: '/goals', label: '목표', icon: Target },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
