import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction, type UserAction } from '../store/db';
import { startOfDay, differenceInDays, format } from 'date-fns';
import { useEffect, useState } from 'react';

// RM5 daily tax
const DAILY_TAX = 5;
// 25% daily debt compound
const DEBT_RATE = 0.25;
// Bankruptcy fee
const BANKRUPTCY_FEE = -50;

export function useEconomy() {
    const [isProcessing, setIsProcessing] = useState(true);

    // Computed balance from all transactions
    const balance = useLiveQuery(async () => {
        const txs = await db.transactions.toArray();
        return txs.reduce((acc, tx) => acc + tx.value, 0);
    }, [], 0);

    const transactions = useLiveQuery(() => db.transactions.orderBy('timestamp').reverse().limit(50).toArray(), [], []);
    const customActions = useLiveQuery(() => db.userActions.toArray(), [], []);

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
                        loopDate = new Date(loopDate.getTime() + 24 * 60 * 60 * 1000); // Step forward EXACTLY one day
                        daysProcessed++;

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
        await db.transactions.add({
            actionId: action.id,
            actionName: action.name,
            value: action.value,
            timestamp: Date.now(),
            type: 'user'
        });
    };

    const addCustomAction = async (action: Omit<UserAction, "id">) => {
        await db.userActions.add({
            id: crypto.randomUUID(),
            ...action
        });
    };

    const deleteCustomAction = async (id: string) => {
        await db.userActions.delete(id);
    };

    const declareBankruptcy = async () => {
        const allTxs = await db.transactions.toArray();
        let currentBalance = allTxs.reduce((acc, tx) => acc + tx.value, 0);

        // The deficit amount to zero it out
        const deficitToZero = -currentBalance;

        await db.transactions.add({
            actionName: 'Bankruptcy Declaration',
            value: deficitToZero + BANKRUPTCY_FEE,
            timestamp: Date.now(),
            type: 'bankruptcy'
        });
    };

    return {
        balance,
        transactions,
        customActions,
        isProcessing,
        logAction,
        addCustomAction,
        deleteCustomAction,
        declareBankruptcy,
        simulateDayPass
    };
}
