import Dexie, { type Table } from 'dexie';

export interface UserAction {
    id: string;
    name: string;
    value: number; // Positive for earning, negative for spending
    questType?: 'main' | 'side' | 'none'; // Distinguishes quest magnitude
}

export interface Todo {
    id: string;
    name: string;
    targetDate: string; // 'yyyy-MM-dd' format to track designated day
    createdAt: number;
}

export interface Transaction {
    id?: number;
    actionId?: string;
    actionName: string;
    value: number;
    timestamp: number; // JS timestamp
    type: 'user' | 'tax' | 'debt' | 'bankruptcy';
}

export interface AppState {
    key: string;
    value: any;
}

export interface Reward {
    id: string;
    name: string;
    cost: number;
    tier: 'common' | 'rare' | 'epic';
}

export class EconomyDB extends Dexie {
    userActions!: Table<UserAction>;
    transactions!: Table<Transaction>;
    appState!: Table<AppState>;
    rewards!: Table<Reward>;
    todos!: Table<Todo>;

    constructor() {
        super('EconomyDB');
        this.version(2).stores({
            userActions: 'id',
            transactions: '++id, timestamp, type',
            appState: 'key',
            rewards: 'id, tier'
        });
        this.version(3).stores({
            userActions: 'id',
            transactions: '++id, timestamp, type',
            appState: 'key',
            rewards: 'id, tier',
            todos: 'id, targetDate'
        });
    }
}

export const db = new EconomyDB();
