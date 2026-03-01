import { useState } from 'react';
import { WalletDisplay } from './components/WalletDisplay';
import { ActionList } from './components/ActionList';
import { CreateActionForm } from './components/CreateActionForm';
import { BankruptcyButton } from './components/BankruptcyButton';
import { DebugPanel } from './components/DebugPanel';
import { Activity } from 'lucide-react';
import { useEconomy } from './hooks/useEconomy';

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { isProcessing, balance } = useEconomy();

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-neutral-400">
        <Activity className="animate-pulse" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans selection:bg-neutral-200 pb-20 md:pb-0 safe-area-bottom">
      {/* App Shell Header */}
      <header className="fixed top-0 left-0 right-0 h-[72px] bg-white/80 backdrop-blur-xl border-b border-neutral-100 z-40 flex items-center justify-center">
        <h1 className="text-[11px] font-bold tracking-[0.2em] text-neutral-800 uppercase flex items-center gap-3">
          Cost <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full"></span> Living
        </h1>
      </header>

      {/* Main Content padding for fixed header */}
      <main className="pt-24 pb-12 w-full flex flex-col items-center">
        <WalletDisplay balance={balance} />

        <div className="w-full max-w-md px-6 mt-8 mb-4">
          <div className="h-px bg-neutral-200/60 w-full rounded-full" />
        </div>

        <ActionList onCreateClick={() => setShowCreateForm(true)} />

        <BankruptcyButton />
      </main>

      {/* Floating Action Button for mobile, or handled by the list...
          The ActionList has its own plus button. */}

      {showCreateForm && (
        <CreateActionForm onClose={() => setShowCreateForm(false)} />
      )}

      <DebugPanel />
    </div>
  );
}

export default App;
