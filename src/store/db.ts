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
    id?: string;
    actionId?: string;
    actionName: string;
    value: number;
    timestamp: number; // JS timestamp
    type: 'user' | 'tax' | 'debt' | 'bankruptcy';
}

export interface Reward {
    id: string;
    name: string;
    cost: number;
    tier: 'common' | 'rare' | 'epic';
}
