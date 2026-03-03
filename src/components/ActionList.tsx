import { Plus, Trash2, Edit2, Zap, Star } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';
import { useState, useRef, useEffect } from 'react';
import { EditActionForm } from './EditActionForm';
import type { UserAction } from '../store/db';

function ActionItem({
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
        startY.current = e.touches[0].clientY;
        isSwiping.current = null;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null || startY.current === null) return;

        const currentClientX = e.touches[0].clientX;
        const currentClientY = e.touches[0].clientY;
        const diffX = currentClientX - startX.current;
        const diffY = currentClientY - startY.current;

        // Directional lock
        if (isSwiping.current === null) {
            if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
                isSwiping.current = Math.abs(diffX) > Math.abs(diffY);
            }
        }

        if (isSwiping.current) {
            let effectiveDiffX = diffX;
            // Require a 40px threshold before we even visually move the card, to further prevent accidental jiggles
            if (!isRevealed && diffX < 0) {
                if (Math.abs(diffX) < 40) return;
                effectiveDiffX = diffX + 40; // Start sliding smoothly after 40px drag
                if (effectiveDiffX > 0) effectiveDiffX = 0;
            }

            if (effectiveDiffX < 0) {
                currentX.current = Math.max(effectiveDiffX, -ACTION_WIDTH - 20); // slight overscroll
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

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        // Visual micro-animation
        setIsClicked(true);
        setTimeout(() => {
            setIsClicked(false);
            // Delay the actual action log slightly so animation finishes gracefully
            setTimeout(() => onLog(action), 150);
        }, 150);
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
                onClick={handleClick}
                className={cn(
                    "relative flex items-center justify-between bg-white border rounded-2xl cursor-pointer transition-all",
                    action.questType === 'side'
                        ? "p-3 shadow-none border-neutral-100 hover:bg-neutral-50 active:bg-neutral-100"
                        : "p-4 shadow-sm border-neutral-200 hover:border-neutral-300 hover:shadow-md hover:bg-neutral-50 active:bg-neutral-100",
                    startX.current === null ? "duration-200 ease-out" : "",
                    isClicked ? "scale-[0.96] shadow-inner" : "active:scale-[0.98]"
                )}
                style={{ transform: `translateX(${offsetX}px)` }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 group-hover:bg-white transition-colors">
                        {action.questType === 'side' ? (
                            <Zap size={14} className="text-blue-500 fill-blue-500/20" />
                        ) : (
                            <Star size={16} className="text-orange-500 fill-orange-500/20" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className={cn(
                            "text-neutral-900 leading-tight",
                            action.questType === 'side' ? "text-sm font-medium" : "text-base font-semibold"
                        )}>
                            {action.name}
                        </span>
                        {action.questType === 'side' && (
                            <span className="text-[9px] text-blue-500/80 font-bold uppercase tracking-widest mt-0.5">Side Quest</span>
                        )}
                        {(!action.questType || action.questType === 'main') && (
                            <span className="text-[9px] text-orange-500/80 font-bold uppercase tracking-widest mt-0.5">Main Quest</span>
                        )}
                    </div>
                </div>
                <div className={cn(
                    "font-bold tabular-nums tracking-tight",
                    "text-positive",
                    action.questType === 'side' ? "text-sm" : "text-base"
                )}>
                    +{Math.abs(action.value)}
                </div>
            </div>
        </div>
    );
}

function QuestGroup({
    title,
    actions,
    isSideQuest,
    logAction,
    deleteCustomAction,
    setEditingAction,
    swipedActionId,
    setSwipedActionId
}: {
    title: string,
    actions: UserAction[],
    isSideQuest: boolean,
    logAction: (a: UserAction) => void,
    deleteCustomAction: (id: string) => void,
    setEditingAction: (a: UserAction) => void,
    swipedActionId: string | null,
    setSwipedActionId: (id: string | null) => void
}) {
    if (actions.length === 0) return null;

    return (
        <div className="mb-6">
            <h4 className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase mb-3 px-2 flex items-center gap-2">
                <div className="h-px w-4 bg-neutral-200" />
                {title}
                <div className="h-px flex-1 bg-neutral-200" />
            </h4>
            <div className={cn(isSideQuest ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3")}>
                {actions.map((action) => (
                    <div key={action.id} className={cn(isSideQuest ? "" : "w-full")}>
                        <ActionItem
                            action={action}
                            onLog={logAction}
                            onEdit={() => setEditingAction(action)}
                            onDelete={() => deleteCustomAction(action.id)}
                            isRevealed={swipedActionId === action.id}
                            onReveal={setSwipedActionId}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ActionList({ onCreateClick }: { onCreateClick: () => void }) {
    const { customActions, logAction, deleteCustomAction, undoTransaction } = useEconomy();
    const [editingAction, setEditingAction] = useState<UserAction | null>(null);
    const [swipedActionId, setSwipedActionId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ id: number, message: string } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleLog = async (action: UserAction) => {
        const txId = await logAction(action);
        setToast({ id: txId as number, message: `Logged ${action.name}` });
    };

    const sortHabits = (a: UserAction, b: UserAction) => {
        if (Math.abs(b.value) !== Math.abs(a.value)) {
            return Math.abs(b.value) - Math.abs(a.value);
        }
        return a.name.localeCompare(b.name);
    };

    if (!customActions) return null;

    const earningActions = customActions.filter(a => a.value > 0).sort(sortHabits);
    const sideQuests = earningActions.filter(a => a.questType === 'side');
    const mainQuests = earningActions.filter(a => a.questType !== 'side');

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

            {earningActions.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                    <p className="text-neutral-500 font-light text-sm mb-4">No quests defined yet.</p>
                    <button
                        onClick={onCreateClick}
                        className="text-neutral-900 font-medium text-sm hover:underline"
                    >
                        Create your first quest
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <QuestGroup
                        title="Side Quests"
                        actions={sideQuests}
                        isSideQuest={true}
                        logAction={handleLog}
                        deleteCustomAction={deleteCustomAction}
                        setEditingAction={setEditingAction}
                        swipedActionId={swipedActionId}
                        setSwipedActionId={setSwipedActionId}
                    />
                    <QuestGroup
                        title="Main Quests"
                        actions={mainQuests}
                        isSideQuest={false}
                        logAction={handleLog}
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
