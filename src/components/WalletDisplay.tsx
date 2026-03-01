import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function WalletDisplay({ balance }: { balance: number }) {
    const isDebt = balance < 0;

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6">
            <h2 className="text-sm font-medium tracking-widest text-neutral-400 uppercase mb-1">Current Balance</h2>
            <div
                className={cn(
                    "text-6xl font-light tracking-tighter transition-colors duration-500",
                    isDebt ? "text-negative" : "text-neutral-900"
                )}
            >
                <span className="text-4xl opacity-50 mr-1">RM</span>
                {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            {isDebt && (
                <div className="mt-4 px-3 py-1 bg-negative/10 text-negative text-xs rounded-full font-medium flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-negative opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-negative"></span>
                    </span>
                    Debt Compounding Active
                </div>
            )}
        </div>
    );
}
