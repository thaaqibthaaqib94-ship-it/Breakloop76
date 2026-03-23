import React, { useMemo } from 'react';
import { Log, Habit } from '../types';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogsProps {
  logs: Log[];
  habits: Habit[];
}

export default function Logs({ logs, habits }: LogsProps) {
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: Log[] } = {};
    
    logs.forEach(log => {
      const date = startOfDay(new Date(log.timestamp)).toISOString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4">
          <Calendar size={32} />
        </div>
        <p className="text-white/40 font-medium">No activity logged yet.</p>
        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-2">Your journey starts with the first control</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Activity History</h2>
        <div className="px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{logs.length} Total Logs</span>
        </div>
      </div>
      
      <div className="space-y-8">
        {groupedLogs.map(([dateStr, dayLogs]) => (
          <div key={dateStr} className="space-y-3">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-1">
              {getDateLabel(dateStr)}
            </h3>
            <div className="space-y-2">
              {dayLogs.map((log) => {
                const habit = habits.find(h => h.id === log.habitId);
                return (
                  <div 
                    key={log.id}
                    className="bg-card p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                        log.status === 'controlled' ? "bg-accent/10 text-accent" : "bg-fire/10 text-fire"
                      )}>
                        {log.status === 'controlled' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{habit?.name || 'Deleted Habit'}</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                          {format(log.timestamp, 'h:mm a')}
                        </p>
                        {log.reason && (
                          <p className="text-[10px] text-white/60 mt-1 italic border-l border-white/10 pl-2">
                            "{log.reason}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                      log.status === 'controlled' ? "text-accent bg-accent/5" : "text-fire bg-fire/5"
                    )}>
                      {log.status === 'controlled' ? '+1 Atom' : 'Reset'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
