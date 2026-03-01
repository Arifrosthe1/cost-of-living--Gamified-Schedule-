import { AlertTriangle } from 'lucide-react';
import { useEconomy } from '../hooks/useEconomy';

export function BankruptcyButton() {
    const { balance, declareBankruptcy } = useEconomy();

    // Show if debt is deeper than 100 RM
    if (balance >= -100) return null;

    const handleBankruptcy = () => {
        if (window.confirm("Declare Bankruptcy? This will wipe your current debt but apply a fixed -RM50 penalty to start over. Are you sure?")) {
            declareBankruptcy();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto px-6 mt-12 mb-8">
            <button
                onClick={handleBankruptcy}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 border-2 border-negative/20 bg-negative/5 text-negative rounded-2xl font-medium hover:bg-negative hover:text-white transition-all active:scale-[0.98]"
            >
                <AlertTriangle size={18} />
                Declare Bankruptcy
            </button>
            <p className="text-center text-xs text-neutral-400 mt-3 font-light px-4">
                Reset compounding debt to a standard -RM50 penalty.
            </p>
        </div>
    );
}
