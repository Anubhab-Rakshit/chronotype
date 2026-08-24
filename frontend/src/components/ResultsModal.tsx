import type { TypingGameState } from '../hooks/useTypingEngine';
import { CornerAnchors } from './CornerAnchors';
import { audio } from '../services/AudioEngine';
import { Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ResultsModalProps {
  state: TypingGameState;
  onRestart: () => void;
  onOpenAuth: () => void;
}

export function ResultsModal({ state, onRestart, onOpenAuth }: ResultsModalProps) {
  const { isFinished, totalTime, penaltyTime, wpm, accuracy, maxStreak, isNewBest, cloudSaved, isSubmittingToCloud } = state;
  const { user } = useAuth();

  useEffect(() => {
    if (isFinished) {
      audio.playSuccess();
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#FFFFFF']
        });
      } catch {
        // Ignore
      }
    }
  }, [isFinished]);

  if (!isFinished) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="hairline-card w-full max-w-2xl p-8 sm:p-12 relative flex flex-col items-center text-center">
        <CornerAnchors />
        
        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="flex items-center gap-2 px-3 py-1 border border-emerald-500/20 bg-emerald-500/10 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">
              {isNewBest ? '★ New Historical Record' : 'Settlement Finalized'}
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-serif italic text-white mb-2">
            Performance Audit.
          </h2>
          <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-10">
            {cloudSaved ? '● Synced to global verified ledger' : isSubmittingToCloud ? '○ Committing to GraphQL ledger...' : 'Cryptographic execution recorded locally'}
          </p>

          {/* Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-10">
            <div className="glass-card p-6 flex flex-col items-center justify-center relative">
              <CornerAnchors />
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#888] mb-2">Velocity</span>
              <div className="text-4xl sm:text-5xl font-serif italic text-white flex items-baseline gap-1">
                {wpm}
                <span className="font-mono text-xs text-[#666]">WPM</span>
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col items-center justify-center relative">
              <CornerAnchors />
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#888] mb-2">Precision</span>
              <div className="text-4xl sm:text-5xl font-serif italic text-emerald-400">
                {accuracy}%
              </div>
              <span className="font-mono text-[9px] text-[#666] mt-1">
                MAX STREAK // {maxStreak}
              </span>
            </div>

            <div className="glass-card p-6 flex flex-col items-center justify-center relative">
              <CornerAnchors />
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#888] mb-2">Total Time</span>
              <div className="text-4xl sm:text-5xl font-serif italic text-white flex items-baseline gap-1">
                {totalTime.toFixed(2)}
                <span className="font-mono text-xs text-[#666]">s</span>
              </div>
              {penaltyTime > 0 && (
                <span className="font-mono text-[9px] text-red-400 mt-1">
                  +{penaltyTime.toFixed(1)}s penalty
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full">
            <button 
              onClick={() => {
                audio.playTick();
                onRestart();
              }}
              className="btn-primary flex items-center gap-2"
            >
              <RotateCcw size={14} />
              <span>Initialize Arena</span>
            </button>
            
            {!user && (
              <button 
                onClick={() => {
                  audio.playTick();
                  onOpenAuth();
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <Trophy size={14} />
                <span>Save to Leaderboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsModal;
