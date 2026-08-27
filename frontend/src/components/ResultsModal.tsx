import { useState, useEffect } from 'react';
import type { TypingGameState } from '../hooks/useTypingEngine';
import { AnimatedCounter } from './AnimatedCounter';

interface ResultsModalProps {
  state: TypingGameState;
  onRestart: () => void;
  onOpenAuth: () => void;
}

export function ResultsModal({ state, onRestart, onOpenAuth }: ResultsModalProps) {
  const { isFinished, wpm, accuracy, isSubmittingToCloud, cloudSaved } = state;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isFinished) {
      setTimeout(() => setMounted(true), 500); // Wait for HUD to slide away
    } else {
      setMounted(false);
    }
  }, [isFinished]);

  const getRankStamp = (wpmScore: number) => {
    if (wpmScore >= 140) return { rank: 'S-TIER', color: 'text-purple-400' };
    if (wpmScore >= 100) return { rank: 'A-CLASS', color: 'text-[#00FFAA]' };
    if (wpmScore >= 70) return { rank: 'B-CLASS', color: 'text-blue-400' };
    if (wpmScore >= 40) return { rank: 'C-CLASS', color: 'text-yellow-400' };
    return { rank: 'D-CLASS', color: 'text-[#888]' };
  };

  const stamp = getRankStamp(wpm);

  if (!isFinished) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onRestart} />
      
      <div className="hairline-card w-full max-w-2xl p-8 sm:p-12 relative flex flex-col items-center">
        
        {/* Typographic Rank Stamp (Background) */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] sm:text-[180px] font-serif italic font-bold tracking-tighter opacity-5 select-none pointer-events-none whitespace-nowrap ${stamp.color}`}>
          {stamp.rank}
        </div>

        <div className="relative z-10 w-full flex flex-col items-center">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-[#888] mb-12 border-b border-white/10 pb-4 w-full text-center">
            Verdict Analysis
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 mb-16 w-full">
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Velocity</span>
              <div className="font-serif italic text-7xl sm:text-8xl text-white tracking-tighter leading-none" style={{ textShadow: '0 0 40px rgba(255,255,255,0.2)' }}>
                {mounted ? <AnimatedCounter value={wpm} duration={1500} /> : 0}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#444] mt-2">Words / Min</span>
            </div>
            
            <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent hidden sm:block" />
            
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Precision</span>
              <div className={`font-serif italic text-6xl sm:text-7xl tracking-tighter leading-none ${stamp.color}`} style={{ textShadow: `0 0 30px currentColor` }}>
                {mounted ? <AnimatedCounter value={accuracy} duration={1500} /> : 0}%
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#444] mt-2">Hit Rate</span>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full border-t border-white/5 pt-8">
            <button
              onClick={onRestart}
              className="flex-1 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] uppercase tracking-[0.2em] transition-all"
            >
              Restart Simulation
            </button>
            
            {!localStorage.getItem('monkeytype_token') && (
              <button
                onClick={onOpenAuth}
                className="flex-1 px-6 py-3 border border-[#00FFAA]/30 bg-[#00FFAA]/10 hover:bg-[#00FFAA]/20 text-[#00FFAA] font-mono text-[10px] uppercase tracking-[0.2em] transition-all"
              >
                Authenticate to Save
              </button>
            )}
          </div>
          
          <div className="h-6 mt-4 flex items-center justify-center">
            {isSubmittingToCloud && <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] animate-pulse">Syncing telemetry...</span>}
            {cloudSaved && <span className="font-mono text-[10px] uppercase tracking-widest text-[#00FFAA]">Score synchronized.</span>}
            {!isSubmittingToCloud && !cloudSaved && !localStorage.getItem('monkeytype_token') && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-red-500">Unauthenticated. Score not saved.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
