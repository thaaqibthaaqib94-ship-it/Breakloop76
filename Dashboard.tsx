import React, { useState } from 'react';
import { AppData, Habit } from '../types';
import { Flame, Target, PlusCircle, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import AttemptDetails from './AttemptDetails';

interface DashboardProps {
  data: AppData;
  logAction: (habitId: string, status: 'controlled' | 'failed', reason?: string) => void;
}

export default function Dashboard({ data, logAction }: DashboardProps) {
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [showAttemptsForId, setShowAttemptsForId] = useState<string | null>(null);
  const [isFailing, setIsFailing] = useState(false);
  const [failureReason, setFailureReason] = useState('');

  if (data.habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center border border-white/5">
          <PlusCircle size={32} className="text-white/20" />
        </div>
        <div>
          <h3 className="text-lg font-medium">No habits yet</h3>
          <p className="text-sm text-white/40">Add a habit using the + button above.</p>
        </div>
      </div>
    );
  }

  if (showAttemptsForId) {
    const activeHabit = data.habits.find(h => h.id === showAttemptsForId);
    if (activeHabit) {
      return (
        <AttemptDetails 
          attempts={data.attempts.filter(a => a.habitId === activeHabit.id)}
          habitName={activeHabit.name}
          onBack={() => setShowAttemptsForId(null)}
        />
      );
    }
  }

  const handleFail = (habitId: string) => {
    logAction(habitId, 'failed', failureReason);
    setIsFailing(false);
    setFailureReason('');
  };

  return (
    <div className="space-y-6 py-4 pb-20">
      {/* Pro Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,255,148,0.5)]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, Warrior
        </h2>
        <p className="text-xs text-white/40 font-medium italic">"The loop ends where your will begins."</p>
      </div>

      <div className="space-y-4">
        {data.habits.map((habit) => (
          <HabitCard 
            key={habit.id}
            habit={habit}
            data={data}
            isExpanded={expandedHabitId === habit.id}
            onToggle={() => setExpandedHabitId(expandedHabitId === habit.id ? null : habit.id)}
            onLogAction={logAction}
            onShowAttempts={() => setShowAttemptsForId(habit.id)}
            onStartFailure={() => setIsFailing(true)}
          />
        ))}
      </div>

      {/* Failure Reason Modal */}
      <AnimatePresence>
        {isFailing && expandedHabitId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg/80 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-sm p-6 rounded-3xl border border-fire/20 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-fire">
                  <AlertCircle size={20} />
                  <h3 className="text-lg font-bold">Reset Streak</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsFailing(false);
                    setFailureReason('');
                  }} 
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white/80 mb-1">
                  {data.habits.find(h => h.id === expandedHabitId)?.name}
                </h4>
                <p className="text-xs text-white/40">It's okay to fail. Write down why it happened to learn from it and grow stronger.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Reason (Optional)</label>
                <textarea 
                  autoFocus
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="What triggered the urge?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-fire transition-colors min-h-[100px] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsFailing(false);
                    setFailureReason('');
                  }}
                  className="flex-1 py-4 bg-white/5 text-white/60 rounded-xl font-bold text-sm border border-white/5 hover:bg-white/10 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => expandedHabitId && handleFail(expandedHabitId)}
                  className="flex-[2] py-4 bg-fire text-white rounded-xl font-bold text-sm shadow-lg shadow-fire/20 hover:bg-fire/90 transition-colors"
                >
                  RESET STREAK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface HabitCardProps {
  key?: React.Key;
  habit: Habit;
  data: AppData;
  isExpanded: boolean;
  onToggle: () => void;
  onLogAction: (habitId: string, status: 'controlled' | 'failed', reason?: string) => void;
  onShowAttempts: () => void;
  onStartFailure: () => void;
}

function HabitCard({ 
  habit, 
  data, 
  isExpanded, 
  onToggle, 
  onLogAction, 
  onShowAttempts,
  onStartFailure
}: HabitCardProps) {
  const getTimeSinceLastFailure = () => {
    const lastFailure = data.logs
      .filter(l => l.habitId === habit.id && l.status === 'failed')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (!lastFailure) return formatDistanceToNow(habit.createdAt);
    return formatDistanceToNow(lastFailure.timestamp);
  };

  const habitAttempts = data.attempts.filter(a => a.habitId === habit.id);
  const bestStreak = Math.max(...habitAttempts.map(a => a.streakReached), 0);
  const worstStreak = Math.min(...habitAttempts.filter(a => a.endDate).map(a => a.streakReached), habit.streak);

  return (
    <div className={cn(
      "bg-card rounded-3xl border transition-all duration-300 overflow-hidden",
      isExpanded ? "border-accent/40 shadow-lg shadow-accent/5" : "border-white/5"
    )}>
      {/* Header / Summary */}
      <button 
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center border border-white/5",
            habit.streak > 0 ? "bg-fire/10 text-fire" : "bg-white/5 text-white/20"
          )}>
            <Flame size={24} className={cn(habit.streak === 0 && "opacity-20")} />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-tight">{habit.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                {habit.streak} Streak
              </span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] uppercase tracking-widest text-accent font-bold">
                {habit.totalAttempts} Attempts
              </span>
            </div>
          </div>
        </div>
        <div className="text-white/20">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 space-y-6"
          >
            <div className="h-px bg-white/5" />

            {/* Streak Display */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className={cn(
                "w-40 h-40 rounded-full border-2 border-white/5 flex flex-col items-center justify-center relative",
                habit.streak > 0 ? "fire-glow border-fire/20" : ""
              )}>
                <div className="flex flex-col items-center">
                  {habit.mode === 'streak' ? (
                    <>
                      <span className="text-5xl font-bold tracking-tighter">
                        {habit.streak}
                      </span>
                      <span className="text-[8px] font-medium uppercase tracking-widest text-white/40 mt-1">
                        Current Streak
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold tracking-tighter text-center px-4">
                        {getTimeSinceLastFailure()}
                      </span>
                      <span className="text-[8px] font-medium uppercase tracking-widest text-white/40 mt-1">
                        Clean Time
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onLogAction(habit.id, 'controlled');
                }}
                className="w-full py-4 rounded-2xl bg-accent text-bg font-bold text-sm tracking-tight shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                I CONTROLLED THE URGE
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFailure();
                }}
                className="w-full py-3 rounded-2xl bg-white/5 text-white/60 font-semibold text-xs tracking-wide border border-white/5 hover:bg-white/10 transition-colors"
              >
                I LOST TODAY
              </motion.button>
            </div>

            {/* Status Section */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onShowAttempts();
                }}
                className="bg-card p-3 rounded-2xl border border-white/5 text-left hover:border-accent/20 transition-colors"
              >
                <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Attempts</span>
                <p className="text-lg font-mono font-bold text-accent mt-0.5">{habit.totalAttempts}</p>
                <p className="text-[7px] text-white/20 mt-0.5">View history</p>
              </button>
              <div className="bg-card p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Best</span>
                  <span className="text-xs font-bold text-accent">{bestStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Worst</span>
                  <span className="text-xs font-bold text-fire">{worstStreak}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
