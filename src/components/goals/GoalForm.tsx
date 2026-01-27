'use client';

import { useState, useEffect } from 'react';
import { Subject, WeeklyGoal } from '@/types/database';
import { useStudent } from '@/components/layout/StudentContext';
import { getSubjects, getWeeklyGoals, setWeeklyGoal, getWeeklyStats } from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import { Loader2, Target, Save } from 'lucide-react';
import { getISOWeek, getYear, format, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

interface GoalWithProgress extends WeeklyGoal {
  currentMinutes: number;
}

export default function GoalForm() {
  const { selectedStudent } = useStudent();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const today = new Date();
  const year = getYear(today);
  const weekNumber = getISOWeek(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent) return;

      setLoading(true);
      try {
        const [subjectsData, goalsData, weeklyStats] = await Promise.all([
          getSubjects(),
          getWeeklyGoals(selectedStudent.id, year, weekNumber),
          getWeeklyStats(selectedStudent.id),
        ]);

        setSubjects(subjectsData);

        // Merge goals with progress
        const goalsWithProgress: GoalWithProgress[] = subjectsData.map((subject) => {
          const existingGoal = goalsData.find(g => g.subject_id === subject.id);
          const stats = weeklyStats.subjectStats[subject.id];
          const currentMinutes = stats?.total_minutes || 0;

          return {
            id: existingGoal?.id || '',
            student_id: selectedStudent.id,
            subject_id: subject.id,
            year,
            week_number: weekNumber,
            target_minutes: existingGoal?.target_minutes || 0,
            created_at: existingGoal?.created_at || '',
            subject,
            currentMinutes,
          };
        });

        setGoals(goalsWithProgress);
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedStudent, year, weekNumber]);

  const handleTargetChange = (subjectId: string, targetMinutes: number) => {
    setGoals(goals.map(g =>
      g.subject_id === subjectId ? { ...g, target_minutes: targetMinutes } : g
    ));
  };

  const handleSave = async (subjectId: string) => {
    if (!selectedStudent) return;

    const goal = goals.find(g => g.subject_id === subjectId);
    if (!goal) return;

    setSaving(subjectId);
    try {
      await setWeeklyGoal({
        student_id: selectedStudent.id,
        subject_id: subjectId,
        year,
        week_number: weekNumber,
        target_minutes: goal.target_minutes,
      });
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Info */}
      <div className="text-center p-4 bg-card border border-border rounded-xl">
        <p className="text-sm text-muted">이번 주</p>
        <p className="font-semibold">
          {format(weekStart, 'M/d', { locale: ko })} - {format(weekEnd, 'M/d', { locale: ko })}
        </p>
        <p className="text-sm text-muted mt-1">{year}년 {weekNumber}주차</p>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = goal.target_minutes > 0
            ? Math.min(100, Math.round((goal.currentMinutes / goal.target_minutes) * 100))
            : 0;
          const isComplete = goal.target_minutes > 0 && goal.currentMinutes >= goal.target_minutes;

          return (
            <div
              key={goal.subject_id}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: goal.subject?.color }}
                  />
                  <span className="font-medium">{goal.subject?.name}</span>
                </div>
                {isComplete && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full">
                    달성! 🎉
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {goal.target_minutes > 0 && (
                <div className="space-y-1">
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? 'bg-green-500' : ''
                      }`}
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isComplete ? undefined : goal.subject?.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{formatDuration(goal.currentMinutes)}</span>
                    <span>{progress}%</span>
                    <span>{formatDuration(goal.target_minutes)}</span>
                  </div>
                </div>
              )}

              {/* Target Input */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted">목표:</label>
                <select
                  value={goal.target_minutes}
                  onChange={(e) => handleTargetChange(goal.subject_id, Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value={0}>설정 안 함</option>
                  <option value={30}>30분</option>
                  <option value={60}>1시간</option>
                  <option value={90}>1시간 30분</option>
                  <option value={120}>2시간</option>
                  <option value={180}>3시간</option>
                  <option value={240}>4시간</option>
                  <option value={300}>5시간</option>
                  <option value={420}>7시간</option>
                  <option value={600}>10시간</option>
                </select>
                <button
                  onClick={() => handleSave(goal.subject_id)}
                  disabled={saving === goal.subject_id}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving === goal.subject_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-semibold">주간 총 목표</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted">목표</p>
            <p className="text-xl font-bold text-primary">
              {formatDuration(goals.reduce((sum, g) => sum + g.target_minutes, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">현재</p>
            <p className="text-xl font-bold">
              {formatDuration(goals.reduce((sum, g) => sum + g.currentMinutes, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
