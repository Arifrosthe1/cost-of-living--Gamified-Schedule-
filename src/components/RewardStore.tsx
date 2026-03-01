import { Plus, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { cn } from '../utils';

export function RewardStore({ onCreateClick }: { onCreateClick: () => void }) {
    const { storedRewards, balance, purchaseReward, deleteReward } = useEconomy();

    if (!storedRewards) return null;

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

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium tracking-widest text-neutral-400 uppercase">Available Rewards</h3>
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
                    {storedRewards.map((reward) => {
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

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteReward(reward.id);
                                        }}
                                        className="p-1.5 text-neutral-300 hover:text-negative hover:bg-negative/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
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
        </div>
    );
}
