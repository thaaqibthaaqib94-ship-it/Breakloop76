import React, { Component, useState, useEffect } from 'react';
import { LayoutDashboard, History, BarChart3, ListTodo, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBreakLoopData } from './useBreakLoopData';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import Analytics from './components/Analytics';
import HabitsList from './components/HabitsList';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { cn } from './lib/utils';
import { HabitMode } from './types';

type View = 'dashboard' | 'logs' | 'analytics' | 'habits' | 'profile';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { data, addHabit, updateHabitName, deleteHabit, logAction, setGoal, setBgColor, resetAllData } = useBreakLoopData(user?.uid);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<HabitMode>('streak');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddHabit = () => {
    if (newName.trim()) {
      addHabit(newName.trim(), newMode);
      setNewName('');
      setIsAddingHabit(false);
      setCurrentView('dashboard');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard data={data} logAction={logAction} />;
      case 'logs':
        return <Logs logs={data.logs} habits={data.habits} />;
      case 'analytics':
        return <Analytics data={data} />;
      case 'habits':
        return (
          <HabitsList 
            habits={data.habits} 
            addHabit={addHabit} 
            updateHabitName={updateHabitName} 
            deleteHabit={deleteHabit} 
          />
        );
      case 'profile':
        return <Profile data={data} setGoal={setGoal} setBgColor={setBgColor} resetAllData={resetAllData} />;
      default:
        return <Dashboard data={data} logAction={logAction} />;
    }
  };

  return (
    <div 
      className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: data.bgColor || '#050505' }}
    >
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tighter text-white">
          Break<span className="text-accent">Loop</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full border border-white/5 accent-glow">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-mono font-medium text-accent">
              {data.habits.length} HABITS
            </span>
          </div>
          <button 
            onClick={() => setIsAddingHabit(true)}
            className="w-8 h-8 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg shadow-accent/20"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAddingHabit && (
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
              className="bg-card w-full max-w-sm p-6 rounded-3xl border border-accent/20 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">New Habit</h3>
                <button onClick={() => setIsAddingHabit(false)} className="text-white/40"><Plus size={20} className="rotate-45" /></button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Habit Name</label>
                <input 
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Social Media"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tracking Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setNewMode('streak')}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold transition-all",
                      newMode === 'streak' ? "bg-accent text-bg" : "bg-white/5 text-white/40 border border-white/5"
                    )}
                  >
                    STREAK
                  </button>
                  <button 
                    onClick={() => setNewMode('time')}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold transition-all",
                      newMode === 'time' ? "bg-accent text-bg" : "bg-white/5 text-white/40 border border-white/5"
                    )}
                  >
                    TIME
                  </button>
                </div>
              </div>
              <button 
                onClick={handleAddHabit}
                className="w-full py-4 bg-accent text-bg rounded-xl font-bold text-sm shadow-lg shadow-accent/20"
              >
                CREATE HABIT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50">
        <NavButton 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')}
          icon={<LayoutDashboard size={20} />}
          label="Home"
        />
        <NavButton 
          active={currentView === 'logs'} 
          onClick={() => setCurrentView('logs')}
          icon={<History size={20} />}
          label="Logs"
        />
        <NavButton 
          active={currentView === 'analytics'} 
          onClick={() => setCurrentView('analytics')}
          icon={<BarChart3 size={20} />}
          label="Stats"
        />
        <NavButton 
          active={currentView === 'habits'} 
          onClick={() => setCurrentView('habits')}
          icon={<ListTodo size={20} />}
          label="Habits"
        />
        <NavButton 
          active={currentView === 'profile'} 
          onClick={() => setCurrentView('profile')}
          icon={<User size={20} />}
          label="Me"
        />
      </nav>
    </div>
  );
}

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-accent scale-110" : "text-white/40 hover:text-white/60"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="w-1 h-1 rounded-full bg-accent mt-0.5"
        />
      )}
    </button>
  );
}
