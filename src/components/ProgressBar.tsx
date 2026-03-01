import { useState } from 'react';
import { cn } from '../utils';
import { useEconomy } from '../hooks/useEconomy';
import { Edit2, Check, X } from 'lucide-react';

interface ProgressBarProps {
    currentBalance: number;
    savingsGoal: number; // 0 if not set
}

export function ProgressBar({ currentBalance, savingsGoal }: ProgressBarProps) {
    const { setSavingsGoal } = useEconomy();
    const [isEditing, setIsEditing] = useState(false);
    const [goalInput, setGoalInput] = useState(savingsGoal.toString());
    const isDebt = currentBalance < 0;

    let progressPercent = 0;
    let label = '';
    let colorClass = '';

    if (isDebt) {
        const maxDebt = Math.min(-50, currentBalance);
        progressPercent = ((currentBalance - maxDebt) / (0 - maxDebt)) * 100;
        label = "Debt Recovery";
        colorClass = "bg-negative";
    } else {
        if (savingsGoal > 0) {
            progressPercent = Math.min(100, (currentBalance / savingsGoal) * 100);
            label = `Savings Goal: RM${savingsGoal}`;
        } else {
            label = "Set a Savings Goal";
            progressPercent = 0;
        }
        colorClass = "bg-positive";
    }

    progressPercent = Math.max(0, Math.min(100, progressPercent));

    const handleSaveGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseInt(goalInput, 10);
        if (!isNaN(num) && num >= 0) {
            setSavingsGoal(num);
        }
        setIsEditing(false);
    };

    return (
        <div className="w-full max-w-md mx-auto px-6 mb-8 mt-2">
            <div className="flex justify-between items-end mb-2">
                {isEditing && !isDebt ? (
                    <form onSubmit={handleSaveGoal} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400">RM</span>
                        <input
                            type="number"
                            autoFocus
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            className="bg-white border border-neutral-200 rounded px-2 py-0.5 text-xs w-20 outline-none focus:border-neutral-400"
                        />
                        <button type="submit" className="text-positive hover:bg-positive/10 rounded p-0.5">
                            <Check size={14} />
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="text-neutral-400 hover:bg-neutral-100 rounded p-0.5">
                            <X size={14} />
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => !isDebt && setIsEditing(true)}>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest transition-colors",
                            isDebt ? "text-negative" : "text-neutral-400 group-hover:text-neutral-600"
                        )}>
                            {label}
                        </span>
                        {!isDebt && (
                            <Edit2 size={10} className="text-neutral-300 group-hover:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>
                )}

                <span className="text-xs font-medium text-neutral-500 tabular-nums">
                    {Math.round(progressPercent)}%
                </span>
            </div>

            <div className="h-2 w-full bg-neutral-200/50 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorClass)}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}
