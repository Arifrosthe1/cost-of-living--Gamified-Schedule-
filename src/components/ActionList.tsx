import { Plus, Trash2 } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';

export function ActionList({ onCreateClick }: { onCreateClick: () => void }) {
    const { customActions, logAction, deleteCustomAction } = useEconomy();

    if (!customActions) return null;

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
                <div className="space-y-3">
                    {customActions.map((action) => {
                        const isEarn = action.value > 0;
                        return (
                            <div
                                key={action.id}
                                className="group relative flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm hover:border-neutral-200 hover:shadow-md transition-all cursor-pointer font-light active:scale-[0.98]"
                                onClick={() => logAction(action)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isEarn ? "bg-positive" : "bg-negative"
                                    )} />
                                    <span className="text-neutral-900">{action.name}</span>
                                </div>
                                <div className={cn(
                                    "font-medium tabular-nums",
                                    isEarn ? "text-positive" : "text-negative"
                                )}>
                                    {isEarn ? "+" : "-"}RM{Math.abs(action.value)}
                                </div>

                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all pr-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteCustomAction(action.id);
                                        }}
                                        className="p-2 text-neutral-300 hover:text-negative hover:bg-negative/10 rounded-full transition-colors ml-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
