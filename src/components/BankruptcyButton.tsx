import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';

export function BankruptcyButton() {
    const { balance, declareBankruptcy } = useEconomy();
    const [showModal, setShowModal] = useState(false);

    // Show if debt is RM299 or deeper
    if (balance > -299) return null;

    const handleConfirm = () => {
        declareBankruptcy();
        setShowModal(false);
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
                <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-200/50 w-full max-w-md p-6 border border-neutral-100 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-negative">
                            <div className="bg-negative/10 flex items-center justify-center rounded-full p-3">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-medium text-neutral-800">Declare Bankruptcy?</h3>
                        </div>
                        
                        <p className="text-neutral-600 font-light leading-relaxed">
                            This will wipe your current debt but apply a fixed <strong className="font-medium text-neutral-900">-RM100 penalty</strong> to start over, and <strong className="font-medium text-neutral-900">completely wipe your streak</strong>.
                        </p>
                        <p className="text-neutral-600 font-light">
                            Are you absolutely sure you want to do this?
                        </p>

                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3.5 rounded-xl font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3.5 rounded-xl font-medium bg-negative text-white hover:bg-negative/90 transition-colors active:scale-[0.98]"
                            >
                                Yes, I'm sure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
