import React, { useState } from 'react';
import { Habit, HabitMode } from '../types';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { cn } from '../lib/utils';

interface HabitsListProps {
  habits: Habit[];
  addHabit: (name: string, mode: HabitMode) => void;
  updateHabitName: (id: string, name: string) => void;
  deleteHabit: (id: string) => void;
}

export default function HabitsList({ habits, addHabit, updateHabitName, deleteHabit }: HabitsListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<HabitMode>('streak');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      addHabit(newName.trim(), newMode);
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateHabitName(editingId, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Manage Habits</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg shadow-accent/20"
        >
          <Plus size={24} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card p-6 rounded-3xl border border-accent/20 space-y-4 overflow-hidden"
          >
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

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAdd}
                className="flex-1 py-3 bg-accent text-bg rounded-xl font-bold text-sm"
              >
                ADD HABIT
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-3 bg-white/5 text-white/60 rounded-xl font-bold text-sm"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {habits.map((habit) => (
          <HabitItem 
            key={habit.id} 
            habit={habit} 
            onDelete={() => deleteHabit(habit.id)}
            onEdit={() => handleEdit(habit.id, habit.name)}
            isEditing={editingId === habit.id}
            editName={editName}
            setEditName={setEditName}
            saveEdit={saveEdit}
            cancelEdit={() => setEditingId(null)}
          />
        ))}
      </div>
    </div>
  );
}

interface HabitItemProps {
  key?: React.Key;
  habit: Habit;
  onDelete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  editName: string;
  setEditName: (val: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
}

function HabitItem({ 
  habit, 
  onDelete, 
  onEdit,
  isEditing,
  editName,
  setEditName,
  saveEdit,
  cancelEdit
}: HabitItemProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
  const editOpacity = useTransform(x, [50, 100], [0, 1]);

  if (isEditing) {
    return (
      <div className="bg-card p-4 rounded-2xl border border-accent/40 flex items-center gap-2">
        <input 
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
        />
        <button onClick={saveEdit} className="p-2 text-accent"><Check size={20} /></button>
        <button onClick={cancelEdit} className="p-2 text-white/40"><X size={20} /></button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Action Backgrounds */}
      <div className="absolute inset-0 flex justify-between items-center px-6">
        <motion.div style={{ opacity: editOpacity }} className="text-accent flex items-center gap-2">
          <Edit2 size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Edit</span>
        </motion.div>
        <motion.div style={{ opacity: deleteOpacity }} className="text-fire flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
          <Trash2 size={20} />
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) onEdit();
          if (info.offset.x < -80) {
            if (confirm("Delete this habit?")) onDelete();
          }
          x.set(0);
        }}
        className="relative z-10 bg-card p-4 border border-white/5 flex items-center justify-between touch-pan-y"
      >
        <div>
          <h4 className="font-semibold text-sm">{habit.name}</h4>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
            {habit.mode === 'streak' ? 'Streak Mode' : 'Time Mode'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-white/60">{habit.streak} Streak</p>
            <p className="text-[10px] text-accent font-mono">{habit.totalAttempts} Attempts</p>
          </div>
          <div className="w-1 h-8 rounded-full bg-white/5" />
        </div>
      </motion.div>
    </div>
  );
}
