import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, limit, writeBatch, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { startOfDay, differenceInDays, format } from 'date-fns';
import type { Transaction, UserAction, Reward, Todo } from '../store/db';
import { useAuth } from '../contexts/AuthContext';

const DAILY_TAX = 5;
const DEBT_RATE = 0.25;
const BANKRUPTCY_FEE = -100;

export function useEconomy() {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(true);

    const [balance, setBalance] = useState(0);
    const [lowestBalance, setLowestBalance] = useState(0);
    const [streakCount, setStreakCount] = useState(0);
    const [savingsGoal, setSavingsGoal] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [customActions, setCustomActions] = useState<UserAction[]>([]);
    const [storedRewards, setStoredRewards] = useState<Reward[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, `users/${user.uid}/appState/economy`), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBalance(data.balance || 0);
                setLowestBalance(data.lowestBalance || 0);
                setStreakCount(data.streakCount || 0);
                setSavingsGoal(data.savingsGoal || 0);
            }
        });
        return unsub;
    }, [user]);

    useEffect(() => {
        if (!user) return;
        
        const txQ = query(collection(db, `users/${user.uid}/transactions`), orderBy('timestamp', 'desc'), limit(50));
        const unsubTx = onSnapshot(txQ, (snap) => {
            setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        });

        const actionsQ = query(collection(db, `users/${user.uid}/habits`));
        const unsubActions = onSnapshot(actionsQ, (snap) => {
            setCustomActions(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserAction)));
        });

        const rewardsQ = query(collection(db, `users/${user.uid}/rewards`));
        const unsubRewards = onSnapshot(rewardsQ, (snap) => {
            setStoredRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reward)));
        });

        const todosQ = query(collection(db, `users/${user.uid}/todos`), orderBy('targetDate', 'asc'));
        const unsubTodos = onSnapshot(todosQ, (snap) => {
            setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Todo)));
        });

        return () => {
            unsubTx();
            unsubActions();
            unsubRewards();
            unsubTodos();
        };
    }, [user]);

    // Background jobs
    useEffect(() => {
        if (!user) {
            setIsProcessing(false);
            return;
        }
        
        let mounted = true;
        
        const runJobs = async () => {
            if (!mounted) return;
            // Check if we already processed jobs this session to prevent infinite dependency loops
            if (sessionStorage.getItem('jobs_run_for_' + user.uid)) {
                if (mounted) setIsProcessing(false);
                return;
            }

            setIsProcessing(true);
            try {
                const stateRef = doc(db, `users/${user.uid}/appState/economy`);
                const snap = await getDoc(stateRef);
                if (!snap.exists()) {
                    setIsProcessing(false);
                    return;
                }

                const state = snap.data();
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                
                let currentStreak = state.streakCount || 0;
                let currentBalance = state.balance || 0;
                let minBalance = state.lowestBalance || 0;
                
                let needsUpdate = false;
                const batch = writeBatch(db);

                if (state.lastPositiveActionDate) {
                    const lastPosDate = new Date(state.lastPositiveActionDate);
                    const todayDate = startOfDay(new Date());
                    if (differenceInDays(todayDate, startOfDay(lastPosDate)) > 1 && currentStreak > 0) {
                        currentStreak = 0;
                        needsUpdate = true;
                    }
                }

                if (!state.lastProcessDate) {
                    batch.update(stateRef, { lastProcessDate: todayStr, streakCount: currentStreak });
                    await batch.commit();
                    sessionStorage.setItem('jobs_run_for_' + user.uid, 'true');
                    setIsProcessing(false);
                    return;
                }

                const lastDateStr = state.lastProcessDate;
                if (lastDateStr !== todayStr) {
                    needsUpdate = true;
                    let loopDate = startOfDay(new Date(lastDateStr));
                    const todayDate = startOfDay(new Date());
                    let daysProcessed = 0;

                    const todosSnap = await getDocs(collection(db, `users/${user.uid}/todos`));
                    const allTodos = todosSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...(d.data() as Omit<Todo, 'id'>) }));

                    while (differenceInDays(todayDate, loopDate) > 0) {
                        const elapsedDayStr = format(loopDate, 'yyyy-MM-dd');
                        loopDate = new Date(loopDate.getTime() + 24 * 60 * 60 * 1000);
                        daysProcessed++;

                        const missedTodos = allTodos.filter((t: any) => t.targetDate === elapsedDayStr);
                        for (const todo of missedTodos) {
                            currentBalance -= 15;
                            if (currentBalance < minBalance) minBalance = currentBalance;
                            
                            const txRef = doc(collection(db, `users/${user.uid}/transactions`));
                            batch.set(txRef, {
                                actionName: `Failed To-Do: ${(todo as Todo).name}`,
                                value: -15,
                                timestamp: Date.now() + daysProcessed * 2 - 1,
                                type: 'user'
                            });
                            batch.delete(todo.ref);
                        }

                        currentBalance -= DAILY_TAX;
                        if (currentBalance < minBalance) minBalance = currentBalance;
                        
                        const taxRef = doc(collection(db, `users/${user.uid}/transactions`));
                        batch.set(taxRef, {
                            actionName: 'Daily Tax',
                            value: -DAILY_TAX,
                            timestamp: Date.now() + daysProcessed * 2,
                            type: 'tax'
                        });

                        if (currentBalance < 0) {
                            const debtCharge = Math.abs(currentBalance) * DEBT_RATE;
                            const roundedCharge = Math.round(debtCharge * 100) / 100;
                            if (roundedCharge > 0) {
                                currentBalance -= roundedCharge;
                                if (currentBalance < minBalance) minBalance = currentBalance;
                                
                                const debtRef = doc(collection(db, `users/${user.uid}/transactions`));
                                batch.set(debtRef, {
                                    actionName: 'Debt Compound (25%)',
                                    value: -roundedCharge,
                                    timestamp: Date.now() + daysProcessed * 2 + 1,
                                    type: 'debt'
                                });
                            }
                        }
                    }

                    batch.update(stateRef, {
                        lastProcessDate: todayStr,
                        balance: currentBalance,
                        lowestBalance: minBalance,
                        streakCount: currentStreak
                    });
                } else if (needsUpdate) {
                    batch.update(stateRef, { streakCount: currentStreak });
                }

                if (needsUpdate || lastDateStr !== todayStr) {
                    await batch.commit();
                }

                // Mark jobs as run for this session
                sessionStorage.setItem('jobs_run_for_' + user.uid, 'true');
            } catch (err) {
                console.error("Failed background jobs", err);
            } finally {
                if (mounted) setIsProcessing(false);
            }
        };

        runJobs();
        return () => { mounted = false; };
    }, [user]);

    const simulateDayPass = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const stateRef = doc(db, `users/${user.uid}/appState/economy`);
            const snap = await getDoc(stateRef);
            if (snap.exists() && snap.data().lastProcessDate) {
                const lastDate = new Date(snap.data().lastProcessDate);
                const previousDay = new Date(lastDate.getTime() - 24 * 60 * 60 * 1000);
                await setDoc(stateRef, { lastProcessDate: format(previousDay, 'yyyy-MM-dd') }, { merge: true });
                window.location.reload();
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const logAction = async (action: UserAction) => {
        if (!user) return "";
        
        let finalValue = action.value;
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        let multiplier = 1;

        const stateRef = doc(db, `users/${user.uid}/appState/economy`);
        const snap = await getDoc(stateRef);
        let newStreak = 0;
        let cBalance = balance;
        let minBalance = lowestBalance;

        if (snap.exists()) {
            const state = snap.data();
            cBalance = state.balance || 0;
            minBalance = state.lowestBalance || 0;

            if (action.value > 0) {
                newStreak = state.streakCount || 0;
                const lastPosStr = state.lastPositiveActionDate;

                if (lastPosStr && lastPosStr !== todayStr) {
                    newStreak += 1;
                } else if (!lastPosStr) {
                    newStreak = 1;
                }

                if (newStreak >= 3) {
                    multiplier = 1.2;
                    finalValue = Math.round(finalValue * multiplier * 100) / 100;
                }
            }
        }

        const txName = multiplier > 1 ? `${action.name} (Bonus x1.2)` : action.name;
        
        cBalance += finalValue;
        if (cBalance < minBalance) minBalance = cBalance;

        const batch = writeBatch(db);
        const txRef = doc(collection(db, `users/${user.uid}/transactions`));
        batch.set(txRef, {
            actionId: action.id,
            actionName: txName,
            value: finalValue,
            timestamp: Date.now(),
            type: 'user'
        });

        const updates: any = {
            balance: cBalance,
            lowestBalance: minBalance
        };
        
        if (action.value > 0) {
            updates.lastPositiveActionDate = todayStr;
            updates.streakCount = newStreak;
        }

        batch.update(stateRef, updates);
        await batch.commit();

        return txRef.id;
    };

    const addCustomAction = async (action: Omit<UserAction, "id">) => {
        if (!user) return;
        const ref = doc(collection(db, `users/${user.uid}/habits`));
        await setDoc(ref, { id: ref.id, ...action });
    };

    const updateCustomAction = async (id: string, action: Partial<Omit<UserAction, "id">>) => {
        if (!user) return;
        await setDoc(doc(db, `users/${user.uid}/habits/${id}`), action, { merge: true });
    };

    const deleteCustomAction = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, `users/${user.uid}/habits/${id}`));
    };

    const undoTransaction = async (id: string) => {
        if (!user) return;
        const txRef = doc(db, `users/${user.uid}/transactions/${id}`);
        const txSnap = await getDoc(txRef);
        if (txSnap.exists()) {
            const val = txSnap.data().value || 0;
            const stateRef = doc(db, `users/${user.uid}/appState/economy`);
            const stateSnap = await getDoc(stateRef);
            let cBalance = balance;
            if (stateSnap.exists()) {
                cBalance = stateSnap.data().balance || 0;
            }
            cBalance -= val;
            
            const batch = writeBatch(db);
            batch.delete(txRef);
            batch.update(stateRef, { balance: cBalance });
            await batch.commit();
        }
    };

    const declareBankruptcy = async () => {
        if (!user) return;
        const batch = writeBatch(db);
        
        const habits = await getDocs(collection(db, `users/${user.uid}/habits`));
        habits.docs.forEach(d => batch.delete(d.ref));
        
        const tds = await getDocs(collection(db, `users/${user.uid}/todos`));
        tds.docs.forEach(d => batch.delete(d.ref));

        const rwds = await getDocs(collection(db, `users/${user.uid}/rewards`));
        rwds.docs.forEach(d => batch.delete(d.ref));

        const txs = await getDocs(collection(db, `users/${user.uid}/transactions`));
        txs.docs.forEach(d => batch.delete(d.ref));
        
        const txRef = doc(collection(db, `users/${user.uid}/transactions`));
        batch.set(txRef, {
            actionName: 'Bankruptcy Penalty',
            value: BANKRUPTCY_FEE,
            timestamp: Date.now(),
            type: 'bankruptcy'
        });

        const stateRef = doc(db, `users/${user.uid}/appState/economy`);
        batch.set(stateRef, {
            balance: BANKRUPTCY_FEE,
            lowestBalance: BANKRUPTCY_FEE,
            streakCount: 0,
            lastProcessDate: format(new Date(), 'yyyy-MM-dd')
        }, { merge: true });

        await batch.commit();
    };

    const setSavingsGoalAction = async (val: number) => {
        if (!user) return;
        await setDoc(doc(db, `users/${user.uid}/appState/economy`), {
            savingsGoal: val
        }, { merge: true });
    };

    const addReward = async (reward: Omit<Reward, "id">) => {
        if (!user) return;
        const ref = doc(collection(db, `users/${user.uid}/rewards`));
        await setDoc(ref, { id: ref.id, ...reward });
    };

    const deleteReward = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, `users/${user.uid}/rewards/${id}`));
    };

    const updateReward = async (id: string, reward: Partial<Omit<Reward, "id">>) => {
        if (!user) return;
        await setDoc(doc(db, `users/${user.uid}/rewards/${id}`), reward, { merge: true });
    };

    const purchaseReward = async (reward: Reward) => {
        if (!user || balance < reward.cost) return false;

        const stateRef = doc(db, `users/${user.uid}/appState/economy`);
        const stateSnap = await getDoc(stateRef);
        let cBalance = balance;
        let minBalance = lowestBalance;
        
        if (stateSnap.exists()) {
            cBalance = stateSnap.data().balance || 0;
            minBalance = stateSnap.data().lowestBalance || 0;
        }

        cBalance -= reward.cost;
        if (cBalance < minBalance) minBalance = cBalance;

        const batch = writeBatch(db);
        const txRef = doc(collection(db, `users/${user.uid}/transactions`));
        batch.set(txRef, {
            actionId: reward.id,
            actionName: `Reward: ${reward.name}`,
            value: -reward.cost,
            timestamp: Date.now(),
            type: 'user'
        });

        batch.update(stateRef, { balance: cBalance, lowestBalance: minBalance });
        await batch.commit();
        return true;
    };

    const addTodo = async (todo: Omit<Todo, "id" | "createdAt">) => {
        if (!user) return;
        const ref = doc(collection(db, `users/${user.uid}/todos`));
        await setDoc(ref, {
            id: ref.id,
            createdAt: Date.now(),
            ...todo
        });
    };

    const completeTodo = async (todo: Todo) => {
        if (!user) return;

        const stateRef = doc(db, `users/${user.uid}/appState/economy`);
        const stateSnap = await getDoc(stateRef);
        let cBalance = balance;
        if (stateSnap.exists()) {
            cBalance = stateSnap.data().balance || 0;
        }
        cBalance += 15;

        const batch = writeBatch(db);
        const txRef = doc(collection(db, `users/${user.uid}/transactions`));
        batch.set(txRef, {
            actionName: `Completed: ${todo.name}`,
            value: 15,
            timestamp: Date.now(),
            type: 'user'
        });

        batch.update(stateRef, { balance: cBalance });
        batch.delete(doc(db, `users/${user.uid}/todos/${todo.id}`));
        await batch.commit();
    };

    const deleteTodo = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, `users/${user.uid}/todos/${id}`));
    };

    return {
        balance,
        lowestBalance,
        transactions,
        customActions,
        todos,
        isProcessing,
        streakCount,
        savingsGoal,
        storedRewards,
        setSavingsGoal: setSavingsGoalAction,
        logAction,
        addCustomAction,
        updateCustomAction,
        deleteCustomAction,
        undoTransaction,
        declareBankruptcy,
        simulateDayPass,
        addReward,
        deleteReward,
        updateReward,
        purchaseReward,
        addTodo,
        completeTodo,
        deleteTodo
    };
}
