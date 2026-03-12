import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction, type UserAction, type Reward, type Todo } from '../store/db';
import { startOfDay, differenceInDays, format } from 'date-fns';
import { useEffect, useState } from 'react';

// RM5 daily tax
const DAILY_TAX = 5;
// 25% daily debt compound
const DEBT_RATE = 0.25;
// Bankruptcy fee
const BANKRUPTCY_FEE = -100;

export function useEconomy() {
    const [isProcessing, setIsProcessing] = useState(true);

    // Computed balance from all transactions
    const balanceData = useLiveQuery(async () => {
        const txs = await db.transactions.orderBy('timestamp').toArray();
        let b = 0;
        let minB = 0;
        for (const tx of txs) {
            b += tx.value;
            if (b < minB) minB = b;
        }
        return { balance: b, lowestBalance: minB };
    }, [], { balance: 0, lowestBalance: 0 });

    const balance = balanceData ? balanceData.balance : 0;
    const lowestBalance = balanceData ? balanceData.lowestBalance : 0;

    const transactions = useLiveQuery(() => db.transactions.orderBy('timestamp').reverse().limit(50).toArray(), [], []);
    const customActions = useLiveQuery(() => db.userActions.toArray(), [], []);
    const storedRewards = useLiveQuery(() => db.rewards.toArray(), [], []);
    const todos = useLiveQuery(() => db.todos.orderBy('targetDate').toArray(), [], []);

    // Streaks & Goals
    const streakCount = useLiveQuery(async () => {
        const streakRecord = await db.appState.get('currentStreak');
        return streakRecord ? parseInt(streakRecord.value, 10) : 0;
    }, [], 0);

    const savingsGoal = useLiveQuery(async () => {
        const goalRecord = await db.appState.get('savingsGoal');
        return goalRecord ? parseFloat(goalRecord.value) : 0;
    }, [], 0);

    let hasRunJobs = false;

    // Run background jobs
    useEffect(() => {
        if (hasRunJobs) return;
        hasRunJobs = true;
        const runJobs = async () => {
            setIsProcessing(true);
            try {
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const stateRecord = await db.appState.get('lastProcessDate');
                const lastPositiveActStr = await db.appState.get('lastPositiveActionDate');

                // Streak expiration logic
                if (lastPositiveActStr) {
                    const lastPosDate = new Date(lastPositiveActStr.value);
                    const todayDate = startOfDay(new Date());
                    const daysSincePos = differenceInDays(todayDate, startOfDay(lastPosDate));

                    if (daysSincePos > 1) {
                        // User missed a full calendar day of positive actions
                        await db.appState.put({ key: 'currentStreak', value: '0' });
                    }
                }

                // Edge Case Fix: If first launch, set today and give 0 balance, NO retroactive taxes
                if (!stateRecord) {
                    await db.appState.put({ key: 'lastProcessDate', value: todayStr });
                    setIsProcessing(false);
                    return;
                }

                const lastDateStr = stateRecord.value;
                if (lastDateStr !== todayStr) {
                    let loopDate = startOfDay(new Date(lastDateStr));
                    const todayDate = startOfDay(new Date());

                    // Number of midnights passed
                    // We step forward one day at a time in the loop.

                    // Calculate accumulated current balance BEFORE jobs
                    const allTxs = await db.transactions.toArray();
                    let currentBalance = allTxs.reduce((acc, tx) => acc + tx.value, 0);

                    let newTransactions: Transaction[] = [];

                    // Process each day sequentially with a while loop
                    let daysProcessed = 0;
                    while (differenceInDays(todayDate, loopDate) > 0) {
                        const elapsedDayStr = format(loopDate, 'yyyy-MM-dd');
                        loopDate = new Date(loopDate.getTime() + 24 * 60 * 60 * 1000); // Step forward EXACTLY one day
                        daysProcessed++;

                        // --- To-Do Penalty Logic ---
                        // Find any uncompleted To-Dos assigned to the day that just ended
                        const missedTodos = await db.todos.where('targetDate').equals(elapsedDayStr).toArray();
                        for (const todo of missedTodos) {
                            currentBalance -= 15;
                            newTransactions.push({
                                actionName: `Failed To-Do: ${todo.name}`,
                                value: -15,
                                timestamp: Date.now() + daysProcessed * 2 - 1, // Order before tax/debt
                                type: 'user'
                            });
                            await db.todos.delete(todo.id);
                        }

                        // Step A: Apply Daily Tax
                        currentBalance -= DAILY_TAX;
                        newTransactions.push({
                            actionName: 'Daily Tax',
                            value: -DAILY_TAX,
                            timestamp: Date.now() + daysProcessed * 2, // sequential timestamps
                            type: 'tax'
                        });

                        // Step B: Apply Debt Trap if below zero AFTER tax
                        if (currentBalance < 0) {
                            const debtCharge = Math.abs(currentBalance) * DEBT_RATE;
                            const roundedCharge = Math.round(debtCharge * 100) / 100; // Keep some precision for decimals up to 2 places

                            if (roundedCharge > 0) {
                                currentBalance -= roundedCharge;
                                newTransactions.push({
                                    actionName: 'Debt Compound (25%)',
                                    value: -roundedCharge,
                                    timestamp: Date.now() + daysProcessed * 2 + 1,
                                    type: 'debt'
                                });
                            }
                        }
                    }

                    if (newTransactions.length > 0) {
                        await db.transactions.bulkAdd(newTransactions);
                    }

                    await db.appState.put({ key: 'lastProcessDate', value: todayStr });
                }
            } catch (err) {
                console.error("Failed background jobs", err);
            } finally {
                setIsProcessing(false);
            }
        };

        runJobs();
    }, []); // Run once on app mount

    const simulateDayPass = async () => {
        setIsProcessing(true);
        try {
            const stateRecord = await db.appState.get('lastProcessDate');
            if (stateRecord) {
                // Rewind the last process date by 1 day so the effect or reload catches it
                const lastDate = new Date(stateRecord.value);
                const previousDay = new Date(lastDate.getTime() - 24 * 60 * 60 * 1000);
                await db.appState.put({ key: 'lastProcessDate', value: format(previousDay, 'yyyy-MM-dd') });
                // We reload to trigger the exact same startup logic
                window.location.reload();
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const logAction = async (action: UserAction) => {
        let finalValue = action.value;
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        let multiplier = 1;

        if (action.value > 0) {
            // Apply Streak Bonus logic
            let currentStreakStr = await db.appState.get('currentStreak');
            let streak = currentStreakStr ? parseInt(currentStreakStr.value, 10) : 0;
            const lastPosStr = await db.appState.get('lastPositiveActionDate');

            if (lastPosStr && lastPosStr.value !== todayStr) {
                // Determine if it was exactly yesterday. If missing a day, it resets (handled in background jobs).
                streak += 1;
            } else if (!lastPosStr) {
                streak = 1;
            }

            await db.appState.put({ key: 'lastPositiveActionDate', value: todayStr });
            await db.appState.put({ key: 'currentStreak', value: streak.toString() });

            if (streak >= 3) {
                multiplier = 1.2;
                finalValue = Math.round(finalValue * multiplier * 100) / 100;
            }
        }

        const txName = multiplier > 1 ? `${action.name} (Bonus x1.2)` : action.name;

        const id = await db.transactions.add({
            actionId: action.id,
            actionName: txName,
            value: finalValue,
            timestamp: Date.now(),
            type: 'user'
        });

        return id as number;
    };

    const addCustomAction = async (action: Omit<UserAction, "id">) => {
        await db.userActions.add({
            id: crypto.randomUUID(),
            ...action
        });
    };

    const updateCustomAction = async (id: string, action: Partial<Omit<UserAction, "id">>) => {
        await db.userActions.update(id, action);
    };

    const deleteCustomAction = async (id: string) => {
        await db.userActions.delete(id);
    };

    const undoTransaction = async (id: number) => {
        await db.transactions.delete(id);
    };

    const declareBankruptcy = async () => {
        // 🚨 TOTAL RESET WIPE 🚨
        await db.userActions.clear();
        await db.todos.clear();
        await db.rewards.clear();
        await db.transactions.clear();
        await db.appState.clear();

        // Seed the initial Permadeath penalty
        await db.transactions.add({
            actionName: 'Bankruptcy Penalty',
            value: BANKRUPTCY_FEE,
            timestamp: Date.now(),
            type: 'bankruptcy'
        });

        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // Reset tracking states correctly
        await db.appState.put({ key: 'currentStreak', value: '0' });
        await db.appState.put({ key: 'lastProcessDate', value: todayStr });
    };

    const setSavingsGoal = async (val: number) => {
        await db.appState.put({ key: 'savingsGoal', value: val.toString() });
    };

    const addReward = async (reward: Omit<Reward, "id">) => {
        await db.rewards.add({
            id: crypto.randomUUID(),
            ...reward
        });
    };

    const deleteReward = async (id: string) => {
        await db.rewards.delete(id);
    };

    const updateReward = async (id: string, reward: Partial<Omit<Reward, "id">>) => {
        await db.rewards.update(id, reward);
    };

    const purchaseReward = async (reward: Reward) => {
        if (balance < reward.cost) return false;

        await db.transactions.add({
            actionId: reward.id,
            actionName: `Reward: ${reward.name}`,
            value: -reward.cost, // Deducting cost
            timestamp: Date.now(),
            type: 'user' // Treat as user spending
        });

        return true;
    };

    const addTodo = async (todo: Omit<Todo, "id" | "createdAt">) => {
        await db.todos.add({
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            ...todo
        });
    };

    const completeTodo = async (todo: Todo) => {
        await db.transactions.add({
            actionName: `Completed: ${todo.name}`,
            value: 15,
            timestamp: Date.now(),
            type: 'user'
        });
        await db.todos.delete(todo.id);
    };

    const deleteTodo = async (id: string) => {
        await db.todos.delete(id);
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
        setSavingsGoal,
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
