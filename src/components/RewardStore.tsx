import { Plus, Sparkles, Trash2, AlertCircle, Edit2, Wallet } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';
import { useState, useRef, useEffect } from 'react';
import { EditActionForm } from './EditActionForm';
import { EditRewardForm } from './EditRewardForm';
import type { UserAction, Reward } from '../store/db';

function SpendingItem({
    action,
    onLog,
    onEdit,
    onDelete,
    isRevealed,
    onReveal
}: {
    action: UserAction,
    onLog: (a: UserAction) => void,
    onEdit: () => void,
    onDelete: () => void,
    isRevealed: boolean,
    onReveal: (id: string | null) => void
}) {
    const startX = useRef<number | null>(null);
    const startY = useRef<number | null>(null);
    const currentX = useRef<number>(0);
    const isSwiping = useRef<boolean | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [isClicked, setIsClicked] = useState(false);
    const ACTION_WIDTH = 140;

    useEffect(() => {
        if (!isRevealed) {
            setOffsetX(0);
        } else {
            setOffsetX(-ACTION_WIDTH);
        }
    }, [isRevealed]);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isSwiping.current = null;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null || startY.current === null) return;

        const currentClientX = e.touches[0].clientX;
        const currentClientY = e.touches[0].clientY;
        const diffX = currentClientX - startX.current;
        const diffY = currentClientY - startY.current;

        if (isSwiping.current === null) {
            if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
                isSwiping.current = Math.abs(diffX) > Math.abs(diffY);
            }
        }

        if (isSwiping.current) {
            let effectiveDiffX = diffX;
            if (!isRevealed && diffX < 0) {
                if (Math.abs(diffX) < 40) return;
                effectiveDiffX = diffX + 40;
                if (effectiveDiffX > 0) effectiveDiffX = 0;
            }

            if (effectiveDiffX < 0) {
                currentX.current = Math.max(effectiveDiffX, -ACTION_WIDTH - 20);
                setOffsetX(isRevealed ? -ACTION_WIDTH + currentX.current : currentX.current);
            } else if (isRevealed && diffX > 0) {
                currentX.current = Math.min(diffX, ACTION_WIDTH + 20);
                setOffsetX(Math.min(0, -ACTION_WIDTH + currentX.current));
            }
        }
    };

    const handleTouchEnd = () => {
        startX.current = null;
        startY.current = null;
        isSwiping.current = null;

        if (offsetX < -ACTION_WIDTH / 2) {
            onReveal(action.id);
            setOffsetX(-ACTION_WIDTH);
        } else {
            onReveal(null);
            setOffsetX(0);
        }
        currentX.current = 0;
    };

    const handleClick = () => {
        if (isRevealed) {
            onReveal(null);
            return;
        }
        if (navigator.vibrate) navigator.vibrate(50);
        setIsClicked(true);
        setTimeout(() => {
            setIsClicked(false);
            setTimeout(() => onLog(action), 150);
        }, 150);
    };

    return (
        <div className="relative w-full overflow-hidden rounded-2xl mb-3">
            <div className="absolute inset-y-[1px] right-[1px] flex items-center justify-end rounded-[15px] overflow-hidden">
                <button
                    onClick={(e) => { e.stopPropagation(); onReveal(null); onEdit(); }}
                    className="h-full bg-neutral-200 text-neutral-600 flex items-center justify-center w-[70px] active:bg-neutral-300 transition-colors"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onReveal(null); onDelete(); }}
                    className="h-full bg-red-500 text-white flex items-center justify-center w-[70px] active:bg-red-600 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleClick}
                className={cn(
                    "relative flex items-center justify-between bg-white border border-neutral-100 rounded-2xl cursor-pointer transition-all p-4 shadow-sm hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100",
                    startX.current === null ? "duration-200 ease-out" : "",
                    isClicked ? "scale-[0.96] shadow-inner" : "active:scale-[0.98]"
                )}
                style={{ transform: `translateX(${offsetX}px)` }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 group-hover:bg-white transition-colors">
                        <Wallet size={16} className="text-negative fill-negative/20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-neutral-900 leading-tight text-base font-semibold">
                            {action.name}
                        </span>
                    </div>
                </div>
                <div className="font-bold tabular-nums tracking-tight text-negative text-base">
                    -RM{Math.abs(action.value)}
                </div>
            </div>
        </div>
    );
}

export function RewardStore({ onCreateClick }: { onCreateClick: () => void }) {
    const { storedRewards, customActions, balance, purchaseReward, deleteReward, logAction, deleteCustomAction, undoTransaction } = useEconomy();
    const [editingAction, setEditingAction] = useState<UserAction | null>(null);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [swipedActionId, setSwipedActionId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ id: string, message: string } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleLog = async (action: UserAction) => {
        const txId = await logAction(action);
        setToast({ id: txId as string, message: `Logged ${action.name}` });
    };

    const sortHabits = (a: UserAction, b: UserAction) => {
        if (Math.abs(b.value) !== Math.abs(a.value)) {
            return Math.abs(b.value) - Math.abs(a.value);
        }
        return a.name.localeCompare(b.name);
    };

    if (!storedRewards || !customActions) return null;

    const spendingActions = customActions.filter(a => a.value <= 0).sort(sortHabits);

    const tierOrder: Record<string, number> = { epic: 3, rare: 2, common: 1 };
    const sortedRewards = [...storedRewards].sort((a, b) => {
        if (tierOrder[a.tier] !== tierOrder[b.tier]) {
            return tierOrder[b.tier] - tierOrder[a.tier];
        }
        return b.cost - a.cost;
    });

    const rewardColor = {
        common: "border-neutral-200 hover:border-neutral-300 bg-white",
        rare: "border-blue-200 hover:border-blue-400 bg-blue-50/30",
        epic: "border-amber-200 hover:border-amber-400 bg-amber-50/30"
    };

    const badgeColor = {
        common: "bg-neutral-100 text-neutral-600",
        rare: "bg-blue-100 text-blue-700",
        epic: "bg-amber-100 text-amber-700 shadow-sm"
    };

    return (
        <div className="w-full max-w-lg mx-auto px-6 animate-in slide-in-from-right duration-500">
            <div className="flex flex-col items-center justify-center mb-8 text-center mt-6">
                <Sparkles className="text-amber-400 mb-3" size={28} />
                <h2 className="text-xl font-medium tracking-tight text-neutral-800">The Reward Store</h2>
                <p className="text-sm text-neutral-500 font-light mt-1">Cash in your RM for IRL treats.</p>
            </div>

            {spendingActions.length > 0 && (
                <div className="mb-10">
                    <h4 className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase mb-3 px-2 flex items-center gap-2">
                        <div className="h-px w-4 bg-neutral-200" />
                        Quick Spending
                        <div className="h-px flex-1 bg-neutral-200" />
                    </h4>
                    <div className="flex flex-col gap-3">
                        {spendingActions.map((action) => (
                            <div key={action.id} className="w-full">
                                <SpendingItem
                                    action={action}
                                    onLog={handleLog}
                                    onEdit={() => setEditingAction(action)}
                                    onDelete={() => deleteCustomAction(action.id)}
                                    isRevealed={swipedActionId === action.id}
                                    onReveal={setSwipedActionId}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium tracking-widest text-neutral-400 uppercase">Purchasable Rewards</h3>
                <button
                    onClick={onCreateClick}
                    className="p-2 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors shadow-sm active:scale-95 flex items-center gap-1 pl-3 pr-4"
                >
                    <Plus size={16} />
                    <span className="text-xs font-semibold">Add Reward</span>
                </button>
            </div>

            {storedRewards.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                    <p className="text-neutral-500 font-light text-sm mb-4">You haven't added any rewards yet.</p>
                    <button
                        onClick={onCreateClick}
                        className="text-neutral-900 font-medium text-sm hover:underline"
                    >
                        Create an indulgence
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedRewards.map((reward) => {
                        const canAfford = balance >= reward.cost;

                        return (
                            <div
                                key={reward.id}
                                className={cn(
                                    "group relative flex flex-col p-5 border rounded-2xl shadow-sm transition-all text-left overflow-hidden",
                                    rewardColor[reward.tier],
                                    !canAfford && "opacity-75 grayscale-[0.2]"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md", badgeColor[reward.tier])}>
                                        {reward.tier}
                                    </span>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingReward(reward);
                                            }}
                                            className="p-1.5 text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteReward(reward.id);
                                            }}
                                            className="p-1.5 text-neutral-300 hover:text-negative hover:bg-negative/10 rounded-full transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h4 className="text-neutral-900 font-medium text-md leading-tight mb-4 pr-4">{reward.name}</h4>
                                </div>

                                <div className="mt-auto">
                                    <button
                                        onClick={() => {
                                            if (canAfford) purchaseReward(reward);
                                        }}
                                        disabled={!canAfford}
                                        className={cn(
                                            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                                            canAfford
                                                ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-md active:scale-[0.98]"
                                                : "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                                        )}
                                    >
                                        {!canAfford && <AlertCircle size={14} />}
                                        {canAfford ? `Buy for RM${reward.cost}` : `Need RM${reward.cost}`}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editingAction && (
                <EditActionForm action={editingAction} onClose={() => setEditingAction(null)} />
            )}

            {editingReward && (
                <EditRewardForm reward={editingReward} onClose={() => setEditingReward(null)} />
            )}

            {/* Undo Toast */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-xl shadow-neutral-900/20 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
                    <span className="text-sm font-light whitespace-nowrap">{toast.message}</span>
                    <div className="w-px h-4 bg-white/20" />
                    <button
                        onClick={() => {
                            undoTransaction(toast.id);
                            setToast(null);
                        }}
                        className="text-sm font-medium text-orange-400 hover:text-orange-300 active:scale-95 transition-all uppercase tracking-wider"
                    >
                        Undo
                    </button>
                </div>
            )}
        </div>
    );
}
