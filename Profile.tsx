import React, { useState } from 'react';
import { AppData } from '../types';
import { Shield, Award, Settings, Info, LogOut, Target, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface ProfileProps {
  data: AppData;
  setGoal: (targetStreak: number, label: string) => void;
  setBgColor: (color: string) => void;
  resetAllData: () => Promise<void>;
}

export default function Profile({ data, setGoal, setBgColor, resetAllData }: ProfileProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [goalLabel, setGoalLabel] = useState(data.goal?.label || '');
  const [goalTarget, setGoalTarget] = useState(data.goal?.targetStreak?.toString() || '');

  const user = auth.currentUser;

  const colors = [
    { name: 'Default', value: '#050505' },
    { name: 'Midnight', value: '#0a0a1a' },
    { name: 'Forest', value: '#051a05' },
    { name: 'Deep Red', value: '#1a0505' },
    { name: 'Slate', value: '#1a1a1a' },
    { name: 'Ocean', value: '#05101a' },
  ];

  const totalAttempts = data.habits.reduce((acc, h) => acc + h.totalAttempts, 0);
  const totalHabits = data.habits.length;
  const totalLogs = data.logs.length;

  const maxStreak = data.habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const progress = data.goal ? Math.min(100, (maxStreak / data.goal.targetStreak) * 100) : 0;

  const handleSaveGoal = () => {
    const target = parseInt(goalTarget);
    if (goalLabel.trim() && !isNaN(target) && target > 0) {
      setGoal(target, goalLabel.trim());
      setIsEditingGoal(false);
    }
  };

  const handleReset = async () => {
    await resetAllData();
    setIsConfirmingReset(false);
  };

  return (
    <div className="space-y-8 py-4">
      {/* User Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-card border-2 border-accent/20 flex items-center justify-center p-1">
          <div className="w-full h-full rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Shield size={40} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">BreakLoop Warrior</h2>
          <p className="text-sm text-white/40">{user?.email || 'Level 1'}</p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">{totalAttempts} Total Attempts</p>
        </div>
      </div>

      {/* Goal Section */}
      <div className="bg-card p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-accent">
            <Target size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Current Goal</h3>
          </div>
          {!isEditingGoal && (
            <button 
              onClick={() => setIsEditingGoal(true)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Edit2 size={16} />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditingGoal ? (
            <motion.div 
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <input 
                value={goalLabel}
                onChange={(e) => setGoalLabel(e.target.value)}
                placeholder="Goal Label (e.g., Reach 100 streak)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <input 
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="Target Streak"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent"
                />
                <button 
                  onClick={handleSaveGoal}
                  className="bg-accent text-bg p-2 rounded-xl"
                >
                  <Check size={20} />
                </button>
                <button 
                  onClick={() => setIsEditingGoal(false)}
                  className="bg-white/5 text-white/40 p-2 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="display"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {data.goal ? (
                <>
                  <div>
                    <p className="text-lg font-bold">{data.goal.label}</p>
                    <p className="text-xs text-white/40">Target: {data.goal.targetStreak} Streak</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-white/40">Progress</span>
                      <span className="text-accent">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-accent shadow-[0_0_10px_rgba(0,255,148,0.5)]"
                      />
                    </div>
                    <p className="text-[10px] text-white/40 text-right">
                      Current Best: {maxStreak} / {data.goal.targetStreak}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-white/40 mb-4">No goal set yet.</p>
                  <button 
                    onClick={() => setIsEditingGoal(true)}
                    className="px-6 py-2 bg-accent/10 text-accent rounded-full text-xs font-bold border border-accent/20"
                  >
                    SET A GOAL
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Color Section */}
      <div className="bg-card p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-accent">
          <Settings size={18} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Background Color</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => setBgColor(color.value)}
              className={cn(
                "h-12 rounded-xl border transition-all flex items-center justify-center",
                data.bgColor === color.value || (!data.bgColor && color.value === '#050505')
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-white/10 hover:border-white/20"
              )}
              style={{ backgroundColor: color.value }}
            >
              <span className="text-[10px] font-bold text-white/60 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-white/5 text-center">
          <p className="text-lg font-bold text-accent">{totalAttempts}</p>
          <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Attempts</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-white/5 text-center">
          <p className="text-lg font-bold text-white">{totalHabits}</p>
          <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Habits</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-white/5 text-center">
          <p className="text-lg font-bold text-white">{totalLogs}</p>
          <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Actions</p>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        <MenuButton icon={<Award size={20} />} label="Achievements" />
        <MenuButton icon={<Settings size={20} />} label="App Settings" />
        <MenuButton icon={<Info size={20} />} label="How it Works" />
        <MenuButton 
          icon={<LogOut size={20} />} 
          label="Sign Out" 
          danger 
          onClick={() => signOut(auth)}
        />
        <MenuButton 
          icon={<X size={20} />} 
          label="Reset All Data" 
          danger 
          onClick={() => setIsConfirmingReset(true)}
        />
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isConfirmingReset && (
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
              className="bg-card w-full max-w-sm p-6 rounded-3xl border border-fire/20 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-fire/10 flex items-center justify-center text-fire mx-auto mb-4">
                  <X size={32} />
                </div>
                <h3 className="text-xl font-bold">Are you sure?</h3>
                <p className="text-sm text-white/40">
                  This will permanently delete all your habits, logs, and settings from Firestore. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmingReset(false)}
                  className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 py-3 bg-fire text-white font-bold rounded-xl shadow-lg shadow-fire/20"
                >
                  DELETE ALL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center pt-4">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Version 1.0.0 • Premium</p>
      </div>
    </div>
  );
}

function MenuButton({ 
  icon, 
  label, 
  danger, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border border-white/5 flex items-center justify-between transition-colors",
        danger ? "text-fire hover:bg-fire/5" : "bg-card hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          danger ? "bg-fire/10" : "bg-white/5"
        )}>
          {icon}
        </div>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
    </button>
  );
}
