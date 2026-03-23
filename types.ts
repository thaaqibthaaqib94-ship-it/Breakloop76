export type HabitMode = 'streak' | 'time';

export interface Attempt {
  id: string;
  habitId: string;
  number: number;
  startDate: number;
  endDate?: number;
  controlsCount: number;
  streakReached: number;
  failureReason?: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  totalAtoms: number;
  totalAttempts: number;
  mode: HabitMode;
  createdAt: number;
  currentAttemptId: string;
}

export interface Log {
  id: string;
  habitId: string;
  attemptId: string;
  timestamp: number;
  status: 'controlled' | 'failed';
  reason?: string;
}

export interface Goal {
  targetStreak: number;
  label: string;
}

export interface AppData {
  habits: Habit[];
  logs: Log[];
  attempts: Attempt[];
  goal?: Goal;
  bgColor?: string;
}
