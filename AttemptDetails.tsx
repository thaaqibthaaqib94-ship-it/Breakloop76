import React from 'react';
import { Attempt } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronLeft, TrendingUp, TrendingDown, Calendar, Target, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AttemptDetailsProps {
  attempts: Attempt[];
  onBack: () => void;
  habitName: string;
}

export default function AttemptDetails({ attempts, onBack, habitName }: AttemptDetailsProps) {
  const [selectedAttempt, setSelectedAttempt] = React.useState<Attempt | null>(null);

  const sortedAttempts = [...attempts].sort((a, b) => b.number - a.number);

  if (selectedAttempt) {
    const prevAttempt = attempts.find(a => a.number === selectedAttempt.number - 1);
    const isBetter = prevAttempt ? selectedAttempt.streakReached > prevAttempt.streakReached : null;

    return (
      <div className="space-y-6 py-4">
        <button onClick={() => setSelectedAttempt(null)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back to Attempts</span>
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Attempt {selectedAttempt.number}</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">{habitName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-accent mb-1">
              <Calendar size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Started</span>
            </div>
            <p className="text-sm font-medium">{format(selectedAttempt.startDate, 'MMM d, yyyy')}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-fire mb-1">
              <Target size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Max Streak</span>
            </div>
            <p className="text-sm font-medium">{selectedAttempt.streakReached}</p>
          </div>
        </div>

        {prevAttempt && (
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between",
            isBetter ? "bg-accent/5 border-accent/20 text-accent" : "bg-fire/5 border-fire/20 text-fire"
          )}>
            <div className="flex items-center gap-3">
              {isBetter ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span className="text-sm font-bold uppercase tracking-widest">
                {isBetter ? 'Better than previous' : 'Less than previous'}
              </span>
            </div>
            <span className="text-xs font-mono">
              {Math.abs(selectedAttempt.streakReached - prevAttempt.streakReached)} diff
            </span>
          </div>
        )}

        <div className="bg-card p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/40">Total Controls</span>
            <span className="text-lg font-bold text-accent">{selectedAttempt.controlsCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/40">Duration</span>
            <span className="text-sm font-medium">
              {selectedAttempt.endDate 
                ? formatDistanceToNow(selectedAttempt.startDate, { addSuffix: false })
                : 'Ongoing'}
            </span>
          </div>
          {selectedAttempt.failureReason && (
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Failure Reason</span>
              </div>
              <p className="text-sm italic text-white/80">"{selectedAttempt.failureReason}"</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
        <ChevronLeft size={20} />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Attempt History</h2>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{habitName}</span>
      </div>

      <div className="space-y-3">
        {sortedAttempts.map((attempt) => (
          <motion.button
            key={attempt.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAttempt(attempt)}
            className="w-full bg-card p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-accent font-bold">
                {attempt.number}
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-sm">Attempt {attempt.number}</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  {format(attempt.startDate, 'MMM d')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">{attempt.streakReached} Max</p>
              <p className="text-[10px] text-accent uppercase tracking-widest">{attempt.controlsCount} Controls</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
