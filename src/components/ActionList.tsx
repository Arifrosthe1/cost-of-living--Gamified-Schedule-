import { Plus, Trash2, Edit2, Zap, Star, Dices } from 'lucide-react';
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
    onReveal,
    isBoosted
}: {
    action: UserAction,
    onLog: (a: UserAction) => void,
    onEdit: () => void,
    onDelete: () => void,
    isRevealed: boolean,
    onReveal: (id: string | null) => void,
    isBoosted?: boolean
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
                    "relative bg-white border rounded-2xl cursor-pointer transition-all w-full box-border",
                    action.questType === 'side'
                        ? cn("flex flex-col justify-between items-start min-h-[104px] p-4 shadow-none",
                             isBoosted 
                                 ? "border-2 border-orange-500/50 bg-orange-50 hover:bg-orange-100 shadow-[0_0_15px_rgba(249,115,22,0.2)]" 
                                 : "border-neutral-100 hover:bg-neutral-50 active:bg-neutral-100")
                        : "flex items-center justify-between p-4 shadow-sm border-neutral-200 hover:border-neutral-300 hover:shadow-md hover:bg-neutral-50 active:bg-neutral-100",
                    startX.current === null ? "duration-200 ease-out" : "",
                    isClicked ? "scale-[0.96] shadow-inner" : "active:scale-[0.98]"
                )}
                style={{ transform: `translateX(${offsetX}px)` }}
            >
                {action.questType === 'side' ? (
                    <>
                        {/* Top Section */}
                        <div className="w-full flex justify-between items-start mb-2">
                            <div className={cn("flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
                                isBoosted ? "bg-orange-100 border-orange-200 group-hover:bg-orange-200" : "bg-neutral-50 border-neutral-100 group-hover:bg-white")}>
                                {isBoosted ? 
                                    <Dices size={14} className="text-orange-500" /> :
                                    <Zap size={14} className="text-blue-500 fill-blue-500/20" />
                                }
                            </div>
                            <div className="font-bold tabular-nums tracking-tight text-positive text-sm mt-1">
                                +{Math.abs(isBoosted ? action.value * 2 : action.value)}
                            </div>
                        </div>
                        {/* Bottom Section */}
                        <div className="mt-auto w-full">
                            <span className="text-neutral-900 leading-tight text-sm font-medium break-words max-w-full block">
                                {action.name}
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 group-hover:bg-white transition-colors">
                                <Star size={16} className="text-orange-500 fill-orange-500/20" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-neutral-900 leading-tight text-base font-semibold block pt-0.5">
                                    {action.name}
                                </span>
                                {(!action.questType || action.questType === 'main') && (
                                    <span className="text-[9px] text-orange-500/80 font-bold uppercase tracking-widest mt-0.5 block">Main Quest</span>
                                )}
                            </div>
                        </div>
                        <div className="font-bold tabular-nums tracking-tight text-positive text-base flex-shrink-0">
                            +{Math.abs(action.value)}
                        </div>
                    </>
                )}
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
    setSwipedActionId,
    boostedActionId
}: {
    title: string,
    actions: UserAction[],
    isSideQuest: boolean,
    logAction: (a: UserAction) => void,
    deleteCustomAction: (id: string) => void,
    setEditingAction: (a: UserAction) => void,
    swipedActionId: string | null,
    setSwipedActionId: (id: string | null) => void,
    boostedActionId?: string | null
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
                            isBoosted={boostedActionId === action.id}
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
    const [toast, setToast] = useState<{ id: string, message: string } | null>(null);

    const [powerups, setPowerups] = useState<{ doubleTroubleLeft: number, bountyHunterActive: boolean, mainQuestOverdriveActive: boolean }>(() => {
        try {
            const saved = localStorage.getItem('cost_of_living_powerups');
            return saved ? JSON.parse(saved) : { doubleTroubleLeft: 0, bountyHunterActive: false, mainQuestOverdriveActive: false };
        } catch(e) {}
        return { doubleTroubleLeft: 0, bountyHunterActive: false, mainQuestOverdriveActive: false };
    });

    useEffect(() => {
        const handlePowerupsUpdate = () => {
            try {
                const saved = localStorage.getItem('cost_of_living_powerups');
                if (saved) setPowerups(JSON.parse(saved));
            } catch(e) {}
        };
        window.addEventListener('powerupsUpdated', handlePowerupsUpdate);
        return () => window.removeEventListener('powerupsUpdated', handlePowerupsUpdate);
    }, []);

    const [diceCooldown, setDiceCooldown] = useState<number | null>(() => {
        try {
            const saved = localStorage.getItem('cost_of_living_dice_cooldown');
            if (saved) {
                const parsed = parseInt(saved);
                if (Date.now() < parsed) return parsed;
                localStorage.removeItem('cost_of_living_dice_cooldown');
            }
        } catch(e) {}
        return null;
    });

    const [diceRoll, setDiceRoll] = useState<{actionId: string, expiresAt: number} | null>(() => {
        try {
            const saved = localStorage.getItem('cost_of_living_dice_roll');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Date.now() < parsed.expiresAt) return parsed;
                localStorage.removeItem('cost_of_living_dice_roll');
            }
        } catch(e) {}
        return null;
    });

    useEffect(() => {
        if (!diceRoll) return;
        const interval = setInterval(() => {
            if (Date.now() >= diceRoll.expiresAt) {
                setDiceRoll(null);
                localStorage.removeItem('cost_of_living_dice_roll');
                const cd = Date.now() + 2 * 60 * 60 * 1000;
                setDiceCooldown(cd);
                localStorage.setItem('cost_of_living_dice_cooldown', cd.toString());
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [diceRoll]);

    useEffect(() => {
        if (!diceCooldown) return;
        const interval = setInterval(() => {
            if (Date.now() >= diceCooldown) {
                setDiceCooldown(null);
                localStorage.removeItem('cost_of_living_dice_cooldown');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [diceCooldown]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleLog = async (action: UserAction) => {
        let actionToLog = { ...action };
        let notes: string[] = [];
        
        let p = { ...powerups };
        let powerupsChanged = false;

        // Double Trouble
        if (p.doubleTroubleLeft > 0) {
            actionToLog.value *= 2;
            notes.push('Double Trouble 2x');
            p.doubleTroubleLeft -= 1;
            powerupsChanged = true;
        }

        // Bounty Hunter
        if (p.bountyHunterActive && actionToLog.questType === 'side') {
            actionToLog.value += 50;
            notes.push('Bounty Hunter +RM50');
            p.bountyHunterActive = false;
            powerupsChanged = true;
        }

        // Main Overdrive
        if (p.mainQuestOverdriveActive && actionToLog.questType !== 'side') {
            actionToLog.value *= 2;
            notes.push('Main Overdrive 2x');
            p.mainQuestOverdriveActive = false;
            powerupsChanged = true;
        }

        if (powerupsChanged) {
            setPowerups(p);
            localStorage.setItem('cost_of_living_powerups', JSON.stringify(p));
        }

        const isBoosted = diceRoll && diceRoll.actionId === action.id;
        if (isBoosted) {
            actionToLog.value *= 2;
            notes.push('Destiny Doubled');
            setDiceRoll(null);
            localStorage.removeItem('cost_of_living_dice_roll');
            
            const cd = Date.now() + 2 * 60 * 60 * 1000;
            setDiceCooldown(cd);
            localStorage.setItem('cost_of_living_dice_cooldown', cd.toString());
        }

        if (notes.length > 0) {
            actionToLog.name = `${actionToLog.name} (${notes.join(', ')})`;
        }

        const txId = await logAction(actionToLog);
        setToast({ id: txId as string, message: `Logged ${action.name}${notes.length > 0 ? ' ✨' : ''}` });
    };

    const handleRollDice = () => {
        if (diceRoll || diceCooldown) return;

        const sideQuests = customActions?.filter(a => a.value > 0 && a.questType === 'side');
        if (!sideQuests || sideQuests.length === 0) return;
        
        const randomQuest = sideQuests[Math.floor(Math.random() * sideQuests.length)];
        const newRoll = {
            actionId: randomQuest.id,
            expiresAt: Date.now() + 15 * 60 * 1000
        };
        setDiceRoll(newRoll);
        localStorage.setItem('cost_of_living_dice_roll', JSON.stringify(newRoll));
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
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
                <div className="space-y-4">
                    {/* Active Power-Ups */}
                    {(powerups.doubleTroubleLeft > 0 || powerups.bountyHunterActive || powerups.mainQuestOverdriveActive) && (
                        <div className="flex flex-wrap gap-2 mb-2 animate-in fade-in slide-in-from-top-2">
                            {powerups.doubleTroubleLeft > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                    <Zap size={14} className="fill-indigo-500" />
                                    Double Trouble ({powerups.doubleTroubleLeft} left)
                                </div>
                            )}
                            {powerups.bountyHunterActive && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                    <Star size={14} className="fill-amber-500" />
                                    Bounty Hunter (+RM50)
                                </div>
                            )}
                            {powerups.mainQuestOverdriveActive && (
                                <div className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                    <Star size={14} className="fill-orange-500" />
                                    Main Overdrive (2x)
                                </div>
                            )}
                        </div>
                    )}
                    {sideQuests.length > 0 && (
                        <div className="bg-neutral-900 rounded-2xl p-4 flex items-center justify-between shadow-sm border border-neutral-800">
                            <div>
                                <h4 className="text-white font-bold tracking-tight text-sm flex items-center gap-2 mb-0.5">
                                    <Dices size={16} className={cn(diceRoll ? "text-orange-500 animate-pulse" : "text-white/80")} /> 
                                    Dice of Destiny
                                </h4>
                                <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1">
                                    {diceRoll ? (
                                        <span className="text-orange-400">Boost Active: {Math.max(0, Math.ceil((diceRoll.expiresAt - Date.now()) / 60000))}m left</span>
                                    ) : diceCooldown ? (
                                        <span className="text-neutral-500">Available in {Math.max(0, Math.ceil((diceCooldown - Date.now()) / 60000))}m</span>
                                    ) : (
                                        "Roll for 15 Min 2x Multiplier"
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={handleRollDice}
                                disabled={!!diceRoll || !!diceCooldown}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
                                    diceRoll 
                                        ? "bg-neutral-800 text-white/30 cursor-not-allowed"
                                        : diceCooldown
                                            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                            : "bg-white text-neutral-900 hover:bg-neutral-100 active:scale-95"
                                )}
                            >
                                {diceRoll ? "Locked" : diceCooldown ? "Cooldown" : "Roll Dice"}
                            </button>
                        </div>
                    )}

                    <QuestGroup
                        title="Side Quests"
                        actions={sideQuests}
                        isSideQuest={true}
                        logAction={handleLog}
                        deleteCustomAction={deleteCustomAction}
                        setEditingAction={setEditingAction}
                        swipedActionId={swipedActionId}
                        setSwipedActionId={setSwipedActionId}
                        boostedActionId={diceRoll?.actionId}
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
