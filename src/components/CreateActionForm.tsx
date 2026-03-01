import { useState } from 'react';
import { X } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';

export function CreateActionForm({ onClose }: { onClose: () => void }) {
    const { addCustomAction } = useEconomy();
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState<'earn' | 'spend'>('earn');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !value) return;

        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;

        const finalValue = type === 'earn' ? Math.abs(numericValue) : -Math.abs(numericValue);

        addCustomAction({
            name,
            value: finalValue,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-200/50 w-full max-w-md p-6 border border-neutral-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-medium text-neutral-800">New Habit</h3>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex bg-neutral-100 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setType('earn')}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                                type === 'earn' ? "bg-white shadow-sm text-positive" : "text-neutral-500 hover:text-neutral-700"
                            )}
                        >
                            Earning
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('spend')}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                                type === 'spend' ? "bg-white shadow-sm text-negative" : "text-neutral-500 hover:text-neutral-700"
                            )}
                        >
                            Spending
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-2">Habit Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. 30 min workout, Watch Netflix"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900/20 transition-all font-light"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-2">Value (RM)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-light">RM</span>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="0"
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900/20 transition-all font-light"
                                required
                                min="1"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-neutral-900 text-white rounded-xl py-3.5 font-medium hover:bg-neutral-800 transition-colors active:scale-[0.98]"
                    >
                        Create {type === 'earn' ? 'Earning' : 'Spending'} Habit
                    </button>
                </form>
            </div>
        </div>
    );
}
