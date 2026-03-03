import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';
import { useState, useRef, useEffect } from 'react';
import { EditActionForm } from './EditActionForm';
import type { UserAction } from '../store/db';

function ActionItem({
    action,
    isEarn,
    onLog,
    onEdit,
    onDelete,
    isRevealed,
    onReveal
}: {
    action: UserAction,
    isEarn: boolean,
    onLog: (a: UserAction) => void,
    onEdit: () => void,
    onDelete: () => void,
    isRevealed: boolean,
    onReveal: (id: string | null) => void
}) {
    const startX = useRef<number | null>(null);
    const currentX = useRef<number>(0);
    const [offsetX, setOffsetX] = useState(0);
    const ACTION_WIDTH = 140; // width of Edit + Delete buttons (70px each)

    useEffect(() => {
        if (!isRevealed) {
            setOffsetX(0);
        } else {
            setOffsetX(-ACTION_WIDTH);
        }
    }, [isRevealed]);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null) return;
        const diff = e.touches[0].clientX - startX.current;

        if (diff < 0) {
            currentX.current = Math.max(diff, -ACTION_WIDTH - 20); // slight overscroll
            setOffsetX(isRevealed ? -ACTION_WIDTH + currentX.current : currentX.current);
        } else if (isRevealed && diff > 0) {
            currentX.current = Math.min(diff, ACTION_WIDTH + 20);
            setOffsetX(Math.min(0, -ACTION_WIDTH + currentX.current));
        }
    };

    const handleTouchEnd = () => {
        if (startX.current === null) return;
        startX.current = null;

        if (offsetX < -ACTION_WIDTH / 2) {
            onReveal(action.id);
            setOffsetX(-ACTION_WIDTH);
        } else {
            onReveal(null);
            setOffsetX(0);
        }
        currentX.current = 0;
    };

    return (
        <div className="relative w-full overflow-hidden rounded-2xl mb-3">
            {/* Background Actions */}
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

            {/* Foreground Card */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    if (isRevealed) {
                        onReveal(null);
                    } else {
                        onLog(action);
                    }
                }}
                className={cn(
                    "relative flex items-center justify-between bg-white border border-neutral-100 rounded-2xl shadow-sm cursor-pointer font-light active:scale-[0.98]",
                    action.questType === 'side' ? "p-3" : "p-4",
                    startX.current === null ? "transition-transform duration-300 ease-out" : ""
                )}
                style={{ transform: `translateX(${offsetX}px)` }}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        isEarn ? "bg-positive" : "bg-negative"
                    )} />
                    <div className="flex flex-col">
                        <span className={cn("text-neutral-900", action.questType === 'side' ? "text-sm" : "text-base")}>{action.name}</span>
                        {isEarn && action.questType === 'side' && (
                            <span className="text-[9px] text-blue-500/80 font-medium uppercase tracking-wider mt-0.5">Side Quest</span>
                        )}
                        {isEarn && (!action.questType || action.questType === 'main') && (
                            <span className="text-[9px] text-orange-500/80 font-medium uppercase tracking-wider mt-0.5">Main Quest</span>
                        )}
                    </div>
                </div>
                <div className={cn(
                    "font-medium tabular-nums",
                    isEarn ? "text-positive" : "text-negative",
                    action.questType === 'side' ? "text-sm" : "text-base"
                )}>
                    {isEarn ? "+" : "-"}RM{Math.abs(action.value)}
                </div>
            </div>
        </div>
    );
}

function ActionGroup({
    title,
    actions,
    isEarn,
    logAction,
    deleteCustomAction,
    setEditingAction,
    swipedActionId,
    setSwipedActionId
}: {
    title: string,
    actions: UserAction[],
    isEarn: boolean,
    logAction: (a: UserAction) => void,
    deleteCustomAction: (id: string) => void,
    setEditingAction: (a: UserAction) => void,
    swipedActionId: string | null,
    setSwipedActionId: (id: string | null) => void
}) {
    if (actions.length === 0) return null;

    return (
        <div className="mb-6">
            <h4 className={cn(
                "text-xs font-semibold tracking-widest uppercase mb-3 px-2 flex items-center gap-2",
                isEarn ? "text-positive/80" : "text-negative/80"
            )}>
                <div className={cn("h-px flex-1", isEarn ? "bg-positive/20" : "bg-negative/20")} />
                {title}
                <div className={cn("h-px flex-1", isEarn ? "bg-positive/20" : "bg-negative/20")} />
            </h4>
            <div>
                {actions.map((action) => (
                    <ActionItem
                        key={action.id}
                        action={action}
                        isEarn={isEarn}
                        onLog={logAction}
                        onEdit={() => setEditingAction(action)}
                        onDelete={() => deleteCustomAction(action.id)}
                        isRevealed={swipedActionId === action.id}
                        onReveal={setSwipedActionId}
                    />
                ))}
            </div>
        </div>
    );
}

export function ActionList({ onCreateClick }: { onCreateClick: () => void }) {
    const { customActions, logAction, deleteCustomAction } = useEconomy();
    const [editingAction, setEditingAction] = useState<UserAction | null>(null);
    const [swipedActionId, setSwipedActionId] = useState<string | null>(null);

    if (!customActions) return null;

    const earningActions = customActions.filter(a => a.value > 0);
    const spendingActions = customActions.filter(a => a.value <= 0);

    return (
        <div className="w-full max-w-md mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium tracking-widest text-neutral-400 uppercase">Your Habits</h3>
                <button
                    onClick={onCreateClick}
                    className="p-2 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
                >
                    <Plus size={16} />
                </button>
            </div>

            {customActions.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                    <p className="text-neutral-500 font-light text-sm mb-4">No habits defined yet.</p>
                    <button
                        onClick={onCreateClick}
                        className="text-neutral-900 font-medium text-sm hover:underline"
                    >
                        Create your first habit
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <ActionGroup
                        title="Earning"
                        actions={earningActions}
                        isEarn={true}
                        logAction={logAction}
                        deleteCustomAction={deleteCustomAction}
                        setEditingAction={setEditingAction}
                        swipedActionId={swipedActionId}
                        setSwipedActionId={setSwipedActionId}
                    />
                    <ActionGroup
                        title="Spending"
                        actions={spendingActions}
                        isEarn={false}
                        logAction={logAction}
                        deleteCustomAction={deleteCustomAction}
                        setEditingAction={setEditingAction}
                        swipedActionId={swipedActionId}
                        setSwipedActionId={setSwipedActionId}
                    />
                </div>
            )}

            {editingAction && (
                <EditActionForm action={editingAction} onClose={() => setEditingAction(null)} />
            )}
        </div>
    );
}
