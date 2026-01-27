'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Subject } from '@/types/database';

interface WeeklyChartProps {
  data: { subject: Subject; minutes: number }[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = data.map(item => ({
    name: item.subject.name,
    minutes: item.minutes,
    hours: Math.round(item.minutes / 60 * 10) / 10,
    color: item.subject.color,
  }));

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        이번 주 학습 기록이 없습니다
      </div>
    );
  }

  const formatTooltip = (value: number) => {
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    if (hours === 0) return `${mins}분`;
    if (mins === 0) return `${hours}시간`;
    return `${hours}시간 ${mins}분`;
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          tickFormatter={(value) => `${Math.round(value / 60)}h`}
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={50}
          fontSize={12}
        />
        <Tooltip
          formatter={(value) => [formatTooltip(Number(value)), '학습 시간']}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
