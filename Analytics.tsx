import React, { useMemo, useState } from 'react';
import { AppData, Habit } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, eachDayOfInterval, subDays, isSameDay } from 'date-fns';
import { Brain, TrendingUp, Calendar, ChevronLeft, ChevronRight, BarChart3, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalyticsProps {
  data: AppData;
}

export default function Analytics({ data }: AnalyticsProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const selectedHabit = useMemo(() => 
    data.habits.find(h => h.id === selectedHabitId), 
    [data.habits, selectedHabitId]
  );

  const stats = useMemo(() => {
    if (!selectedHabitId) return null;

    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    const habitLogs = data.logs.filter(l => l.habitId === selectedHabitId);

    const chartData = last7Days.map(day => {
      const dayLogs = habitLogs.filter(l => isSameDay(l.timestamp, day));
      return {
        date: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        controls: dayLogs.filter(l => l.status === 'controlled').length,
        failures: dayLogs.filter(l => l.status === 'failed').length,
      };
    });

    // Monthly data
    const monthlyGroups: { [key: string]: number } = {};
    habitLogs.forEach(l => {
      if (l.status === 'controlled') {
        const month = format(l.timestamp, 'MMM yyyy');
        monthlyGroups[month] = (monthlyGroups[month] || 0) + 1;
      }
    });
    const monthlyData = Object.entries(monthlyGroups)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Insights
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    habitLogs.forEach(l => {
      if (l.status === 'controlled') {
        const date = new Date(l.timestamp);
        hourCounts[date.getHours()]++;
        dayCounts[date.getDay()]++;
      }
    });

    const bestHour = hourCounts.indexOf(Math.max(...hourCounts));
    const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      chartData,
      monthlyData,
      bestTime: `${bestHour}:00`,
      bestDay: days[bestDayIndex],
      totalControls: habitLogs.filter(l => l.status === 'controlled').length,
      totalFailures: habitLogs.filter(l => l.status === 'failed').length,
    };
  }, [data.logs, selectedHabitId]);

  if (data.habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <p className="text-white/40">No habits to analyze yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <AnimatePresence mode="wait">
        {!selectedHabitId ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold tracking-tight">Select a Habit</h2>
            <div className="space-y-3">
              {data.habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => setSelectedHabitId(habit.id)}
                  className="w-full bg-card p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-accent/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <BarChart3 size={20} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm">{habit.name}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                        {habit.totalAttempts} Attempts
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-accent transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedHabitId(null)}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back to Habits</span>
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">{selectedHabit?.name}</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">Performance Stats</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-1.5 text-accent mb-1.5">
                  <TrendingUp size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Efficiency</span>
                </div>
                <p className="text-xl font-bold tracking-tighter">
                  {stats && (stats.totalControls + stats.totalFailures > 0)
                    ? Math.round((stats.totalControls / (stats.totalControls + stats.totalFailures)) * 100)
                    : 0}%
                </p>
              </div>
              <div className="bg-card p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-1.5 text-fire mb-1.5">
                  <Brain size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Attempts</span>
                </div>
                <p className="text-xl font-bold tracking-tighter">
                  {selectedHabit?.totalAttempts}
                </p>
              </div>
              <div className="bg-card p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-1.5 text-gold mb-1.5">
                  <Award size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Atoms</span>
                </div>
                <p className="text-xl font-bold tracking-tighter">
                  {selectedHabit?.totalAtoms || 0}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-card p-6 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Weekly Activity</h3>
                <span className="text-[10px] font-medium text-white/20">{format(subDays(new Date(), 6), 'MMM d')} - {format(new Date(), 'MMM d')}</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData}>
                    <defs>
                      <linearGradient id="colorControls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF94" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF94" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff40', fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#00FF94', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="controls" 
                      stroke="#00FF94" 
                      fillOpacity={1} 
                      fill="url(#colorControls)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trends */}
            {stats?.monthlyData && stats.monthlyData.length > 0 && (
              <div className="bg-card p-6 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Monthly Growth</h3>
                <div className="space-y-4">
                  {stats.monthlyData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-16 text-[10px] font-bold text-white/40 uppercase">{item.month}</div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / Math.max(...stats.monthlyData.map(d => d.count))) * 100}%` }}
                          className="h-full bg-accent"
                        />
                      </div>
                      <div className="text-[10px] font-mono text-accent">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Insights</h3>
              
              <div className="bg-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-accent">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/40 font-medium">Most consistent on</p>
                  <p className="text-sm font-bold">{stats?.bestDay}</p>
                </div>
              </div>

              <div className="bg-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-accent">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/40 font-medium">Best performance time</p>
                  <p className="text-sm font-bold">{stats?.bestTime}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
