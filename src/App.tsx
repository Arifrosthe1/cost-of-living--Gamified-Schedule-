import { useState, useEffect } from 'react';
import { WalletDisplay } from './components/WalletDisplay';
import { ActionList } from './components/ActionList';
import { TodoList } from './components/TodoList';
import { CreateActionForm } from './components/CreateActionForm';
import { BankruptcyButton } from './components/BankruptcyButton';
import { DebugPanel } from './components/DebugPanel';
import { Activity, Flame, LayoutDashboard, Gift, BellOff } from 'lucide-react';
import { useEconomy } from './hooks/useEconomy';
import { useNotifications } from './hooks/useNotifications';
import { cn } from './utils';
import { ProgressBar } from './components/ProgressBar';
import { RewardStore } from './components/RewardStore';
import { CreateRewardForm } from './components/CreateRewardForm';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { LogOut } from 'lucide-react';

type TabView = 'dashboard' | 'rewards';

function App() {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [showCreateActionForm, setShowCreateActionForm] = useState(false);
  const [showCreateRewardForm, setShowCreateRewardForm] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS and not standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissedIOS = localStorage.getItem('ios-prompt-dismissed');
    
    if (isIOS && !isStandalone && !dismissedIOS) {
      setShowIOSPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const dismissIOSPrompt = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('ios-prompt-dismissed', 'true');
  };
  const { isProcessing, balance, streakCount, savingsGoal } = useEconomy();
  const { permission, requestPermission } = useNotifications();
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-neutral-400">
        <Activity className="animate-pulse" size={32} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans selection:bg-neutral-200 pb-28 md:pb-12 safe-area-bottom overflow-x-hidden max-w-full">
      {/* App Shell Header */}
      <header className="fixed top-0 left-0 right-0 h-[calc(72px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white/95 backdrop-blur-xl border-b border-neutral-100 z-40 flex items-center justify-center px-6">
        <h1 className="text-[11px] font-bold tracking-[0.2em] text-neutral-800 uppercase flex items-center gap-3">
          Cost <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full"></span> Living
        </h1>

        {/* Streak & Notification Indicator */}
        <div className="absolute right-6 flex items-center gap-2">
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors active:scale-95 animate-in fade-in"
              title="Enable Notifications"
            >
              <BellOff size={16} />
            </button>
          )}

          {streakCount > 0 && (
            <div className="flex items-center gap-1 text-orange-500 font-bold text-sm bg-orange-50 px-2 py-1 rounded-full animate-in fade-in slide-in-from-top-2">
              <Flame size={14} className="fill-orange-500" />
              <span>{streakCount}</span>
            </div>
          )}
          
          <button
            onClick={signOut}
            className="p-1.5 ml-2 text-neutral-400 hover:text-red-600 bg-neutral-50 hover:bg-red-50 rounded-full transition-colors active:scale-95 animate-in fade-in"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 w-full flex flex-col items-center">

        {/* PWA Install prompts */}
        {showInstallPrompt && (
          <div className="w-full max-w-md px-6 mb-4 animate-in slide-in-from-top-2">
            <div className="bg-neutral-900 text-white rounded-2xl p-4 flex items-center justify-between border border-neutral-800 shadow-lg">
              <div className="flex flex-col gap-0.5 pr-2">
                <span className="text-xs font-bold text-left">Install Cost of Living</span>
                <span className="text-[10px] text-neutral-400 text-left">Add to home screen for offline access and push alerts.</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all active:scale-95"
                >
                  Install
                </button>
                <button
                  onClick={dismissPrompt}
                  className="text-neutral-400 hover:text-white text-xs p-1"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {showIOSPrompt && (
          <div className="w-full max-w-md px-6 mb-4 animate-in slide-in-from-top-2">
            <div className="bg-neutral-900 text-white rounded-2xl p-4 flex flex-col gap-2 border border-neutral-800 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold">Install on iPhone / iPad</span>
                <button
                  onClick={dismissIOSPrompt}
                  className="text-neutral-400 hover:text-white text-xs p-1"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 text-left leading-relaxed">
                Tap the Share button at the bottom of Safari, then select <strong>"Add to Home Screen"</strong> for full offline access.
              </span>
            </div>
          </div>
        )}

        {/* Wallet and Progress Bar are persistent across tabs */}
        <div className="w-full transition-all duration-500">
          <WalletDisplay balance={balance} />
          <ProgressBar currentBalance={balance} savingsGoal={savingsGoal} />
        </div>

        <div className="w-full max-w-md px-6 mb-2">
          <div className="h-px bg-neutral-200/60 w-full rounded-full" />
        </div>

        {/* Tab Routing */}
        {activeTab === 'dashboard' && (
          <div className="w-full flex flex-col items-center animate-in slide-in-from-left duration-500">
            <ActionList onCreateClick={() => setShowCreateActionForm(true)} />
            <TodoList />
            <BankruptcyButton />
          </div>
        )}

        {activeTab === 'rewards' && (
          <RewardStore onCreateClick={() => setShowCreateRewardForm(true)} />
        )}

      </main>

      {/* Modals */}
      {showCreateActionForm && (
        <CreateActionForm onClose={() => setShowCreateActionForm(false)} />
      )}

      {showCreateRewardForm && (
        <CreateRewardForm onClose={() => setShowCreateRewardForm(false)} />
      )}

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-neutral-200 z-30 pb-safe pb-4 pt-3 px-6 pb-6">
        <div className="max-w-md mx-auto flex justify-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all",
              activeTab === 'dashboard' ? "text-neutral-900 bg-neutral-100" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
            )}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Habits</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all",
              activeTab === 'rewards' ? "text-neutral-900 bg-neutral-100" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
            )}
          >
            <Gift size={20} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Rewards</span>
          </button>
        </div>
      </nav>

      {/* Dev Tools */}
      <DebugPanel />
    </div>
  );
}

export default App;
