import { useState, useEffect } from 'react';
import { AppData, Habit, Log, Attempt } from './types';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const INITIAL_DATA: AppData = {
  habits: [],
  logs: [],
  attempts: [],
};

export function useBreakLoopData(userId: string | undefined) {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Validate connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (userId) {
      setIsAuthReady(true);
    } else {
      setIsAuthReady(false);
      setData(INITIAL_DATA);
    }
  }, [userId]);

  // Real-time sync with Firestore
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', userId));
    const logsQuery = query(collection(db, 'logs'), where('userId', '==', userId));
    const attemptsQuery = query(collection(db, 'attempts'), where('userId', '==', userId));
    const settingsDoc = doc(db, 'settings', userId);

    // One-time migration from localStorage
    const migrateData = async () => {
      const storageKey = `breakloop_data_${userId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const batch = writeBatch(db);
          let hasData = false;
          const now = Date.now();

          if (parsed.habits?.length > 0) {
            parsed.habits.forEach((h: any) => {
              const habit = {
                id: h.id || crypto.randomUUID(),
                name: h.name || 'Unnamed Habit',
                streak: typeof h.streak === 'number' ? h.streak : 0,
                totalAtoms: typeof h.totalAtoms === 'number' ? h.totalAtoms : 0,
                totalAttempts: typeof h.totalAttempts === 'number' ? h.totalAttempts : 1,
                mode: h.mode === 'time' ? 'time' : 'streak',
                createdAt: typeof h.createdAt === 'number' ? h.createdAt : now,
                currentAttemptId: h.currentAttemptId || crypto.randomUUID(),
                userId
              };
              batch.set(doc(db, 'habits', habit.id), habit);
            });
            hasData = true;
          }
          if (parsed.logs?.length > 0) {
            parsed.logs.forEach((l: any) => {
              const log = {
                id: l.id || crypto.randomUUID(),
                habitId: l.habitId,
                attemptId: l.attemptId || crypto.randomUUID(),
                timestamp: typeof l.timestamp === 'number' ? l.timestamp : now,
                status: l.status === 'failed' ? 'failed' : 'controlled',
                reason: l.reason || '',
                userId
              };
              if (log.habitId) {
                batch.set(doc(db, 'logs', log.id), log);
              }
            });
            hasData = true;
          }
          if (parsed.attempts?.length > 0) {
            parsed.attempts.forEach((a: any) => {
              const attempt = {
                id: a.id || crypto.randomUUID(),
                habitId: a.habitId,
                number: typeof a.number === 'number' ? a.number : 1,
                startDate: typeof a.startDate === 'number' ? a.startDate : now,
                endDate: a.endDate || null,
                controlsCount: typeof a.controlsCount === 'number' ? a.controlsCount : 0,
                streakReached: typeof a.streakReached === 'number' ? a.streakReached : 0,
                failureReason: a.failureReason || '',
                userId
              };
              if (attempt.habitId) {
                batch.set(doc(db, 'attempts', attempt.id), attempt);
              }
            });
            hasData = true;
          }
          if (parsed.goal || parsed.bgColor) {
            const settings: any = { userId };
            if (parsed.goal && typeof parsed.goal.targetStreak === 'number' && typeof parsed.goal.label === 'string') {
              settings.goal = parsed.goal;
            }
            if (parsed.bgColor) {
              settings.bgColor = parsed.bgColor;
            }
            batch.set(doc(db, 'settings', userId), settings, { merge: true });
            hasData = true;
          }

          if (hasData) {
            await batch.commit();
            localStorage.removeItem(storageKey);
            console.log('Successfully migrated data to Firestore');
          }
        } catch (e) {
          console.error('Migration failed', e);
        }
      }
    };

    migrateData();

    const unsubHabits = onSnapshot(habitsQuery, (snapshot) => {
      const habits = snapshot.docs.map(doc => doc.data() as Habit);
      setData(prev => ({ ...prev, habits }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'habits'));

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as Log).sort((a, b) => b.timestamp - a.timestamp);
      setData(prev => ({ ...prev, logs }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'logs'));

    const unsubAttempts = onSnapshot(attemptsQuery, (snapshot) => {
      const attempts = snapshot.docs.map(doc => doc.data() as Attempt);
      setData(prev => ({ ...prev, attempts }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attempts'));

    const unsubSettings = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.data();
        setData(prev => ({ 
          ...prev, 
          goal: settings.goal,
          bgColor: settings.bgColor
        }));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${userId}`));

    return () => {
      unsubHabits();
      unsubLogs();
      unsubAttempts();
      unsubSettings();
    };
  }, [isAuthReady, userId]);

  const addHabit = async (name: string, mode: 'streak' | 'time') => {
    if (!userId) return;
    const habitId = crypto.randomUUID();
    const attemptId = crypto.randomUUID();
    const now = Date.now();

    const newAttempt: Attempt & { userId: string } = {
      id: attemptId,
      habitId,
      number: 1,
      startDate: now,
      controlsCount: 0,
      streakReached: 0,
      userId
    };

    const newHabit: Habit & { userId: string } = {
      id: habitId,
      name,
      streak: 0,
      totalAtoms: 0,
      totalAttempts: 1,
      mode,
      createdAt: now,
      currentAttemptId: attemptId,
      userId
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'habits', habitId), newHabit);
      batch.set(doc(db, 'attempts', attemptId), newAttempt);
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'habits/attempts');
    }
  };

  const updateHabitName = async (id: string, name: string) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'habits', id), { name }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `habits/${id}`);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'habits', id));
      
      // Note: In a real app, you'd probably want to delete associated logs/attempts too
      // but Firestore doesn't support cascading deletes easily without a cloud function
      // or client-side batching of all IDs. For simplicity, we'll just delete the habit.
      // The rules will still protect the orphaned data.
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `habits/${id}`);
    }
  };

  const logAction = async (habitId: string, status: 'controlled' | 'failed', reason?: string) => {
    if (!userId) return;
    const timestamp = Date.now();
    
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentAttempt = data.attempts.find(a => a.id === habit.currentAttemptId);
    if (!currentAttempt) return;

    const logId = crypto.randomUUID();
    const newLog: any = {
      id: logId,
      habitId,
      attemptId: currentAttempt.id,
      timestamp,
      status,
      userId
    };
    if (reason) newLog.reason = reason;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'logs', logId), newLog);

      if (status === 'controlled') {
        batch.set(doc(db, 'attempts', currentAttempt.id), {
          controlsCount: currentAttempt.controlsCount + 1,
          streakReached: Math.max(currentAttempt.streakReached, habit.streak + 1)
        }, { merge: true });

        batch.set(doc(db, 'habits', habitId), {
          streak: habit.streak + 1,
          totalAtoms: (habit.totalAtoms || 0) + 1
        }, { merge: true });
      } else {
        const nextAttemptId = crypto.randomUUID();
        const nextAttemptNumber = currentAttempt.number + 1;

        const updateAttempt: any = {
          endDate: timestamp
        };
        if (reason) updateAttempt.failureReason = reason;

        batch.set(doc(db, 'attempts', currentAttempt.id), updateAttempt, { merge: true });

        const nextAttempt: any = {
          id: nextAttemptId,
          habitId,
          number: nextAttemptNumber,
          startDate: timestamp,
          controlsCount: 0,
          streakReached: 0,
          userId
        };

        batch.set(doc(db, 'attempts', nextAttemptId), nextAttempt);

        batch.set(doc(db, 'habits', habitId), {
          streak: 0,
          totalAttempts: nextAttemptNumber,
          currentAttemptId: nextAttemptId
        }, { merge: true });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'logs/habits/attempts');
    }
  };

  const setGoal = async (targetStreak: number, label: string) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'settings', userId), { 
        userId,
        goal: { targetStreak, label } 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${userId}`);
    }
  };

  const setBgColor = async (color: string) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'settings', userId), { 
        userId,
        bgColor: color 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${userId}`);
    }
  };

  const resetAllData = async () => {
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      
      data.habits.forEach(h => {
        batch.delete(doc(db, 'habits', h.id));
      });
      data.logs.forEach(l => {
        batch.delete(doc(db, 'logs', l.id));
      });
      data.attempts.forEach(a => {
        batch.delete(doc(db, 'attempts', a.id));
      });
      batch.delete(doc(db, 'settings', userId));

      await batch.commit();
      setData(INITIAL_DATA);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'all_data');
    }
  };

  return {
    data,
    addHabit,
    updateHabitName,
    deleteHabit,
    logAction,
    setGoal,
    setBgColor,
    resetAllData
  };
}
