'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Subject } from '@/types/database';

interface WeeklyChartProps {
  data: { subject: Subject; pages: number }[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = data.map(item => ({
    name: item.subject.name,
    pages: item.pages,
    color: item.subject.color,
  }));

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        이번 주 학습 기록이 없습니다
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          tickFormatter={(value) => `${value}p`}
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={50}
          fontSize={12}
        />
        <Tooltip
          formatter={(value) => [`${Number(value)}p`, '완료 페이지']}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="pages" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
