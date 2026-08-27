import type { TypingGameState } from '../hooks/useTypingEngine';
import { CornerAnchors } from './CornerAnchors';
import { AnimatedCounter } from './AnimatedCounter';

interface TimerHUDProps {
  state: TypingGameState;
}

export function TimerHUD({ state }: TimerHUDProps) {
  const { rawElapsedTime, penaltyTime, totalTime, wpm, accuracy, characters, currentIndex, isStarted, isFinished } = state;
  const progress = characters.length > 0 ? (currentIndex / characters.length) * 100 : 0;
  
  const currentTarget = characters[currentIndex] || '';
  const upcomingText = characters.slice(currentIndex + 1, currentIndex + 14);

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* Top Fixed Glow Progress Line */}
      <div className="fixed top-0 left-0 h-[1.5px] bg-white/5 w-full z-50">
        <div 
          className="h-full bg-emerald-500 transition-all duration-100 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-[3px] bg-emerald-400 blur-[3px]" />
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Column 1: Telemetry State */}
        <div className="relative group">
          <div className="hairline-card p-5 sm:p-6 relative flex flex-col h-full justify-between">
            <CornerAnchors />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                Telemetry State
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isStarted && !isFinished ? 'bg-[#00FFAA] animate-pulse' : 'bg-[#444]'}`} />
                <span className={`font-mono text-[10px] uppercase tracking-widest ${isStarted && !isFinished ? 'text-[#00FFAA]' : 'text-[#666]'}`}>
                  {isStarted && !isFinished ? 'Active' : 'Standby'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Execution Time</span>
                <div className="font-mono text-xl sm:text-2xl tracking-tighter text-[#E0E0E0]">
                  {rawElapsedTime.toFixed(2)}<span className="text-[10px] text-[#666] ml-1">s</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Latency Penalty</span>
                <div className="font-mono text-xl sm:text-2xl tracking-tighter text-red-500">
                  +{penaltyTime.toFixed(1)}<span className="text-[10px] text-red-500/50 ml-1">s</span>
                </div>
              </div>
              <div className="flex justify-between items-end pt-3 mt-1 border-t border-white/5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#555]">Net Total</span>
                <div className="font-mono text-xl sm:text-2xl tracking-tighter text-[#00FFAA]">
                  {totalTime.toFixed(2)}<span className="text-[10px] text-[#00FFAA]/50 ml-1">s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Target Glyph (Middle) */}
        <div className="relative group w-full flex flex-col items-center justify-center shrink-0">
          <div className="hairline-card w-full p-5 sm:p-6 flex flex-col items-center justify-between relative h-full">
            <CornerAnchors />
            
            <div className="relative z-10 flex flex-col items-center w-full h-full">
              <div className="flex items-center justify-center w-full border-b border-white/5 pb-3 mb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                  Target Input Stream
                </span>
              </div>

              {/* Massive Hero Typography in Playfair Display Italic */}
              <div className="relative flex-1 flex items-center justify-center min-h-[100px] sm:min-h-[120px] w-full mix-blend-exclusion">
                <div 
                  className={`text-7xl sm:text-8xl lg:text-[100px] font-serif italic tracking-tighter leading-none text-white transition-all duration-150 ${
                    isFinished ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                  }`}
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.15)',
                  }}
                >
                  {isFinished ? '✓' : currentTarget === ' ' ? '␣' : currentTarget}
                </div>
              </div>

              {/* Look-ahead Queue */}
              <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02] w-max mx-auto">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#666]">Queue</span>
                <span className="text-[#333]">|</span>
                <div className="flex gap-1.5 text-xs font-mono tracking-widest">
                  {upcomingText.map((char, i) => (
                    <span 
                      key={i} 
                      className="text-[#444]"
                      style={{ opacity: Math.max(0.2, 1 - (i * 0.15)) }}
                    >
                      {char === ' ' ? '␣' : char}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Velocity & Precision */}
        <div className="relative group">
          <div className="hairline-card p-5 sm:p-6 relative flex flex-col h-full justify-between">
            <CornerAnchors />

            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                Velocity & Precision
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#444]">
                Sub-second Engine
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Speed Velocity</span>
                <div className="font-mono text-xl sm:text-2xl tracking-tighter text-[#E0E0E0]">
                  <AnimatedCounter value={wpm} /><span className="text-[10px] text-[#666] ml-1">WPM</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Hit Precision</span>
                <div className="font-mono text-xl sm:text-2xl tracking-tighter text-[#00FFAA]">
                  <AnimatedCounter value={accuracy} /><span className="text-[10px] text-[#00FFAA]/50 ml-1">%</span>
                </div>
              </div>
              <div className="flex justify-between items-end pt-3 mt-1 border-t border-white/5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#555]">Sequence Delta</span>
                <div 
                  className="font-mono text-xs tracking-widest text-[#888] transition-colors duration-100"
                  style={{ 
                    color: currentIndex > 0 && currentIndex % 10 === 0 ? '#FFF' : '#888',
                    textShadow: currentIndex > 0 && currentIndex % 10 === 0 ? '0 0 10px rgba(255,255,255,0.8)' : 'none'
                  }}
                >
                  {currentIndex} / {characters.length} CHARS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimerHUD;
