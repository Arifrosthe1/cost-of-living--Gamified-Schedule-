import { useState } from 'react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';
import { Target, CheckCircle2, Clock, CalendarDays, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';

export function TodoList() {
    const { todos, addTodo, completeTodo } = useEconomy();
    const [inputValue, setInputValue] = useState('');
    const [isTomorrow, setIsTomorrow] = useState(false);

    if (!todos) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const targetDateObj = isTomorrow ? addDays(new Date(), 1) : new Date();
        const targetDate = format(targetDateObj, 'yyyy-MM-dd');

        addTodo({
            name: inputValue.trim(),
            targetDate
        });

        setInputValue('');
        // Reset to today by default after submitting
        setIsTomorrow(false);
    };

    const handleComplete = (todo: any) => {
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        completeTodo(todo);
    };

    return (
        <div className="w-full max-w-md mx-auto px-6 mt-8">
            <h3 className="text-sm font-medium tracking-widest text-neutral-400 uppercase mb-6 flex items-center gap-2">
                <Target size={16} />
                Daily Contracts
            </h3>

            <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100 transition-all">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add a new contract..."
                        className="flex-1 bg-transparent px-4 py-3 outline-none text-neutral-900 placeholder:text-neutral-400 text-sm font-medium w-0 min-w-0"
                    />
                    <div className="flex items-center p-1.5 gap-1 border-l border-neutral-100 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsTomorrow(false)}
                            className={cn(
                                "p-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider",
                                !isTomorrow ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                            )}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsTomorrow(true)}
                            className={cn(
                                "p-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider",
                                isTomorrow ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                            )}
                        >
                            Tmrw
                        </button>
                        <div className="w-px h-6 bg-neutral-200 mx-1" />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="p-2 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-2">
                {todos.length === 0 ? (
                    <div className="text-center py-6 px-4 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                        <p className="text-neutral-400 font-light text-sm">No active contracts.</p>
                    </div>
                ) : (
                    todos.map(todo => {
                        const isForTomorrow = todo.targetDate > format(new Date(), 'yyyy-MM-dd');
                        
                        return (
                            <div 
                                key={todo.id}
                                onClick={() => handleComplete(todo)}
                                className="group flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-2xl cursor-pointer hover:border-neutral-300 hover:shadow-md active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 border-neutral-200 group-hover:border-green-500 group-hover:bg-green-50 transition-colors">
                                        <CheckCircle2 size={14} className="text-transparent group-hover:text-green-500 transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-neutral-900 text-sm font-semibold">{todo.name}</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {isForTomorrow ? (
                                                <Clock size={10} className="text-neutral-400" />
                                            ) : (
                                                <CalendarDays size={10} className="text-orange-400" />
                                            )}
                                            <span className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest",
                                                isForTomorrow ? "text-neutral-400" : "text-orange-400"
                                            )}>
                                                {isForTomorrow ? 'Tomorrow' : 'Today'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="font-bold tabular-nums tracking-tight text-positive text-sm flex-shrink-0">
                                    +15
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
