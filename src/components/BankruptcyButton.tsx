import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';

export function BankruptcyButton() {
    const { balance, declareBankruptcy } = useEconomy();
    const [showModal, setShowModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // Show if debt is RM299 or deeper
    if (balance > -299) return null;

    const handleConfirm = () => {
        if (confirmText !== 'I GIVE UP') return;
        declareBankruptcy();
        setShowModal(false);
        setConfirmText('');
    };

    return (
        <>
            <div className="w-full max-w-md mx-auto px-6 mt-12 mb-8">
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 border-2 border-negative/20 bg-negative/5 text-negative rounded-2xl font-medium hover:bg-negative hover:text-white transition-all active:scale-[0.98]"
                >
                    <AlertTriangle size={18} />
                    Declare Bankruptcy
                </button>
                <p className="text-center text-xs text-neutral-400 mt-3 font-light px-4">
                    Reset compounding debt to a standard -RM100 penalty.
                </p>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-red-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-red-900/50 w-full max-w-md p-6 border-2 border-red-500 flex flex-col gap-6 relative overflow-hidden">
                        
                        {/* Red warning gradient */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-3 text-red-600 relative z-10">
                            <div className="bg-red-100 flex items-center justify-center rounded-full p-3 border border-red-200">
                                <AlertTriangle size={28} className="text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight">Declare Bankruptcy?</h3>
                        </div>
                        
                        <div className="text-neutral-700 font-medium leading-relaxed relative z-10 space-y-4">
                            <p className="text-red-600 font-bold uppercase tracking-widest text-sm">
                                🚨 WARNING: TOTAL SYSTEM WIPE 🚨
                            </p>
                            <p>
                                Declaring bankruptcy will permanently delete ALL your data, including all your habits, side quests, rewards, to-dos, and transaction history.
                            </p>
                            <p>
                                You will have to build your life again from scratch.
                            </p>
                            <p className="text-sm border-l-4 border-red-500 pl-3 italic bg-red-50 p-3 rounded-r-lg">
                                Please take a screenshot of your screen right now so you do not forget what habits and rewards to add back.
                            </p>
                        </div>

                        <div className="mt-2 relative z-10">
                            <label className="block text-sm font-bold text-neutral-800 mb-2 uppercase tracking-wide">
                                Type "I GIVE UP" to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                placeholder="I GIVE UP"
                                className="w-full bg-neutral-50 border-2 border-neutral-200 rounded-xl px-4 py-4 text-neutral-900 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono tracking-widest text-center uppercase font-bold placeholder:text-neutral-300 placeholder:font-normal"
                            />
                        </div>

                        <div className="flex flex-col gap-3 mt-4 relative z-10">
                            <button
                                onClick={handleConfirm}
                                disabled={confirmText !== 'I GIVE UP'}
                                className="w-full py-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                            >
                                Total Wipe
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setConfirmText('');
                                }}
                                className="w-full py-4 rounded-xl font-semibold bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
