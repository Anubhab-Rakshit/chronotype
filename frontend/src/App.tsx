import { useState, useEffect } from 'react';
import { CanvasFluidBackground } from './components/CanvasFluidBackground';
import { Navbar } from './components/Navbar';
import { TimerHUD } from './components/TimerHUD';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { ResultsModal } from './components/ResultsModal';
import { LeaderboardView } from './components/LeaderboardView';
import { HistoryView } from './components/HistoryView';
import { AuthModal } from './components/AuthModal';
import { BootSequence } from './components/BootSequence';
import { useTypingEngine } from './hooks/useTypingEngine';
import { useSoundEffects } from './hooks/useSoundEffects';
import { audio } from './services/AudioEngine';

function App() {
  const { playSound, isMuted, setIsMuted } = useSoundEffects();
  const { state, restart } = useTypingEngine(playSound);
  const { isFinished } = state;

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);

  // Global Hotkeys: ESC to restart arena or close active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLeaderboard) {
          setShowLeaderboard(false);
        } else if (showHistory) {
          setShowHistory(false);
        } else if (showAuth) {
          setShowAuth(false);
        } else {
          audio.playTick();
          restart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [restart, showLeaderboard, showHistory, showAuth]);

  return (
    <div className="h-screen w-screen bg-black text-[#F5F5F5] relative selection:bg-white selection:text-black overflow-hidden flex flex-col">
      {!hasBooted && <BootSequence onComplete={() => setHasBooted(true)} />}
      {/* SplitStellar Liquid Smoke Flow-Field Background */}
      <CanvasFluidBackground />
      <div className="film-grain" />

      {/* Floating Notchbar Navigation */}
      <Navbar
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenAuth={() => setShowAuth(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      {/* Main Interactive Stage */}
      <main 
        className={`relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 gap-4 sm:gap-6 pt-16 pb-6 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isFinished ? 'opacity-0 translate-y-12 pointer-events-none blur-sm' : 'opacity-100 translate-y-0'
        }`}
      >
        
        {/* SplitStellar Telemetry Grid (Network State Cards) */}
        <div className="w-full shrink-0">
          <TimerHUD state={state} />
        </div>

        {/* Central Character Hero Stage & Flat Hardware Key Deck */}
        <div className="w-full flex justify-center shrink-0">
          <VirtualKeyboard state={state} />
        </div>

        {/* Technical Footer Status */}
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-[#666] shrink-0">
          <span className="flex items-center gap-2">
            <span>PRESS</span>
            <kbd className="px-2 py-0.5 rounded border border-white/10 text-[#888] bg-white/5">
              ESC
            </kbd>
            <span>TO RESET</span>
          </span>
          <span>//</span>
          <span>
            LATENCY PENALTY: <span className="text-red-400 font-semibold">+0.5s</span>
          </span>
        </div>
      </main>

      {/* Overlays & Modals */}
      <ResultsModal
        state={state}
        onRestart={restart}
        onOpenAuth={() => setShowAuth(true)}
      />

      {showLeaderboard && (
        <LeaderboardView onClose={() => setShowLeaderboard(false)} />
      )}

      {showHistory && (
        <HistoryView onClose={() => setShowHistory(false)} />
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}

export default App;
