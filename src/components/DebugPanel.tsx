import { useState } from 'react';
import { Bug, X, ChevronRight, RefreshCw } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';
import { format } from 'date-fns';

export function DebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const { transactions, simulateDayPass } = useEconomy();

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 p-3 bg-neutral-900 text-white rounded-full shadow-lg hover:scale-105 transition-transform z-50 flex items-center gap-2"
                title="Developer Debug Panel"
            >
                <Bug size={18} />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col md:items-end justify-end md:justify-end md:p-6 transition-all animate-in slide-in-from-bottom duration-300">
            <div className="bg-white md:rounded-3xl shadow-2xl flex flex-col w-full h-full md:h-auto md:max-h-[85vh] md:max-w-lg border border-neutral-200 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                        <Bug size={18} className="text-neutral-500" />
                        <h3 className="font-semibold tracking-tight text-neutral-800">Debug & Audit Log</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    <section>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Controls</h4>
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60">
                            <button
                                onClick={() => simulateDayPass()}
                                className="w-full flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 shadow-sm transition-all text-sm font-medium text-neutral-700 active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={16} className="text-neutral-400" />
                                    Simulate +1 Day Passing
                                </div>
                                <ChevronRight size={16} className="text-neutral-300" />
                            </button>
                            <p className="mt-3 text-xs text-neutral-500 font-light">
                                Rewinds internal last process date by 24 hours and reloads the app to force background execution of taxes and compounding.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Audit Log</h4>
                        <div className="space-y-3 font-mono text-[11px] leading-relaxed">
                            {!transactions || transactions.length === 0 ? (
                                <div className="text-neutral-400 italic">No transactions recorded yet.</div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id || tx.timestamp} className="p-3 bg-neutral-900 text-neutral-300 rounded-lg shadow-inner">
                                        <div className="flex justify-between text-neutral-500 mb-1">
                                            <span>{format(new Date(tx.timestamp), 'MMM d, HH:mm:ss')}</span>
                                            <span className="uppercase text-[9px] tracking-widest">{tx.type}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-1">
                                            <span className="text-white break-words pr-2">{tx.actionName}</span>
                                            <span className={tx.value > 0 ? "text-positive shrink-0" : "text-negative shrink-0"}>
                                                {tx.value > 0 ? '+' : ''}RM{Math.abs(tx.value)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
