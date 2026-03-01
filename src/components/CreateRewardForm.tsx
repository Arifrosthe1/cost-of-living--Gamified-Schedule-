import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';

export function CreateRewardForm({ onClose }: { onClose: () => void }) {
    const { addReward } = useEconomy();
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [tier, setTier] = useState<'common' | 'rare' | 'epic'>('common');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cost) return;

        const numericCost = parseInt(cost, 10);
        if (isNaN(numericCost) || numericCost <= 0) return;

        addReward({
            name,
            cost: numericCost,
            tier,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-200/50 w-full max-w-md p-6 border border-neutral-100 relative overflow-hidden">

                {tier === 'epic' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                )}

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-xl font-medium text-neutral-800 flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={18} />
                        New Reward
                    </h3>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-2">Reward Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Watch 1 Episode Netflix"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900/20 transition-all font-light"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-2">Cost (RM)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-light">RM</span>
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="100"
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900/20 transition-all font-light"
                                required
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Tier Selector */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-2">Rarity Tier</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['common', 'rare', 'epic'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTier(t as any)}
                                    className={cn(
                                        "py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border",
                                        t === 'common' && tier === t && "bg-neutral-800 text-white border-neutral-800",
                                        t === 'rare' && tier === t && "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20",
                                        t === 'epic' && tier === t && "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20",
                                        tier !== t && "bg-white text-neutral-400 border-neutral-200 hover:bg-neutral-50"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-neutral-900 text-white rounded-xl py-3.5 font-medium hover:bg-neutral-800 transition-colors active:scale-[0.98]"
                    >
                        Create Reward
                    </button>
                </form>
            </div>
        </div>
    );
}
