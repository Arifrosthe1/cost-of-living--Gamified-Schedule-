import { localDb } from '../store/db';
import { db } from './firebase';
import { collection, doc, writeBatch, getDoc } from 'firebase/firestore';

export async function migrateLocalDataToCloud(uid: string) {
    try {
        const migrationDocRef = doc(db, `users/${uid}/appState/migration`);
        const migrationDoc = await getDoc(migrationDocRef);

        // Prevent double migration if they log in on another device later
        if (migrationDoc.exists() && migrationDoc.data()?.migrated === true) {
            console.log("Data already migrated for this user.");
            return;
        }

        console.log("Starting local Dexie to Firestore migration...");
        const batch = writeBatch(db);

        // 1. App State
        const allAppState = await localDb.appState.toArray();
        const economyDocRef = doc(db, `users/${uid}/appState/economy`);
        
        let initialBalance = 0;
        let initialStreak = 0;
        let initialSavingsGoal = 0;
        let lastProcessDate = '';
        let lastPositiveActionDate = '';
        
        // Calculate balance from local transactions to ensure accuracy
        const allTxs = await localDb.transactions.toArray();
        let currentB = 0;
        let minB = 0;
        
        for (const tx of allTxs) {
            currentB += tx.value;
            if (currentB < minB) minB = currentB;
        }
        initialBalance = currentB;

        for (const state of allAppState) {
            if (state.key === 'currentStreak') initialStreak = parseInt(state.value, 10);
            if (state.key === 'savingsGoal') initialSavingsGoal = parseFloat(state.value);
            if (state.key === 'lastProcessDate') lastProcessDate = state.value;
            if (state.key === 'lastPositiveActionDate') lastPositiveActionDate = state.value;
        }

        batch.set(economyDocRef, {
            balance: initialBalance,
            lowestBalance: minB,
            streakCount: initialStreak,
            savingsGoal: initialSavingsGoal,
            lastProcessDate: lastProcessDate || new Date().toISOString().split('T')[0],
            lastPositiveActionDate: lastPositiveActionDate
        }, { merge: true });

        // 2. Habits (UserActions)
        const allHabits = await localDb.userActions.toArray();
        for (const habit of allHabits) {
            const ref = doc(collection(db, `users/${uid}/habits`), habit.id);
            batch.set(ref, habit);
        }

        // 3. To-Dos
        const allTodos = await localDb.todos.toArray();
        for (const todo of allTodos) {
            const ref = doc(collection(db, `users/${uid}/todos`), todo.id);
            batch.set(ref, todo);
        }

        // 4. Rewards
        const allRewards = await localDb.rewards.toArray();
        for (const reward of allRewards) {
            const ref = doc(collection(db, `users/${uid}/rewards`), reward.id);
            batch.set(ref, reward);
        }

        // 5. Transactions (Careful: Dexie auto-incremented IDs might be numbers, Firestore needs strings)
        // We will batch these in chunks if there are >500 naturally, but for a personal app it's usually fine
        // Firestore batch limit is 500 ops.
        
        // Split transactions into chunks of 450 to be safe (since we already added some ops above)
        let txChunks = [];
        let i, j;
        for (i = 0, j = allTxs.length; i < j; i += 450) {
            txChunks.push(allTxs.slice(i, i + 450));
        }

        // First Chunk is executed with the main batch
        if (txChunks.length > 0) {
            for (const tx of txChunks[0]) {
                const ref = doc(collection(db, `users/${uid}/transactions`), tx.id?.toString());
                const txData = { ...tx };
                if (txData.id) delete txData.id; // Optional: don't duplicate ID field
                batch.set(ref, txData);
            }
        }

        // Mark Migration as Complete
        batch.set(migrationDocRef, { migrated: true, timestamp: Date.now() });

        console.log("Committing main migration batch...");
        await batch.commit();

        // Process any remaining transaction chunks
        if (txChunks.length > 1) {
            for (let c = 1; c < txChunks.length; c++) {
                const chunkBatch = writeBatch(db);
                for (const tx of txChunks[c]) {
                     const ref = doc(collection(db, `users/${uid}/transactions`), tx.id?.toString());
                     const txData = { ...tx };
                     if (txData.id) delete txData.id;
                     chunkBatch.set(ref, txData);
                }
                console.log(`Committing transaction chunk ${c}...`);
                await chunkBatch.commit();
            }
        }

        console.log("Migration completely finished!");

    } catch (err) {
        console.error("Migration failed: ", err);
    }
}
