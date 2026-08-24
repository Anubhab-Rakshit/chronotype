import type { TypingGameState } from '../hooks/useTypingEngine';
import { VirtualKeyboard } from './VirtualKeyboard';
import { CornerAnchors } from './CornerAnchors';

interface GameAreaProps {
  state: TypingGameState;
}

export function GameArea({ state }: GameAreaProps) {
  const { characters, currentIndex, isFinished, penaltyFlash, penaltyFloater } = state;
  const targetChar = characters[currentIndex] || '';
  const upcomingText = characters.slice(currentIndex + 1, currentIndex + 14);

  return (
    <div className="flex flex-col items-center w-full gap-4 sm:gap-6">
      
      {/* Target Glyph Stage Card */}
      <div className="relative group w-full max-w-[640px] flex flex-col items-center justify-center shrink-0">
        <div className="hairline-card w-full py-6 sm:py-8 px-8 flex flex-col items-center justify-center relative">
          <CornerAnchors />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
              Target Input Stream
            </span>

            {/* Massive Hero Typography in Playfair Display Italic */}
            <div className="relative flex items-center justify-center min-h-[80px] sm:min-h-[120px]">
              <div 
                className={`text-7xl sm:text-8xl lg:text-[120px] font-serif italic tracking-tighter leading-none text-white transition-all duration-150 ${
                  isFinished ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                }`}
                style={{
                  textShadow: '0 0 40px rgba(255,255,255,0.15)',
                }}
              >
                {isFinished ? '—' : targetChar}
              </div>

              {/* Error Shake / Red Glitch Flash */}
              {penaltyFlash && (
                <div 
                  className="absolute inset-0 flex items-center justify-center text-8xl sm:text-9xl lg:text-[140px] font-serif italic tracking-tighter leading-none text-red-500 opacity-80 pointer-events-none animate-pulse"
                  style={{ transform: 'translate(3px, -2px)' }}
                >
                  {targetChar}
                </div>
              )}

              {/* Penalty Floating Pill */}
              {penaltyFloater && (
                <div className="absolute -top-4 right-4 px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/20 text-red-400 font-mono text-[10px] animate-bounce">
                  {penaltyFloater.text}
                </div>
              )}
            </div>

            {/* Upcoming Sequence Ribbon (SplitStellar Mono Tape) */}
            <div className="flex items-center gap-2 overflow-hidden max-w-full px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#666] pr-2 border-r border-white/10">
                Queue
              </span>
              <div 
                className="flex gap-2.5 overflow-hidden font-mono text-sm tracking-wider text-[#888]"
                style={{
                  maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                }}
              >
                {upcomingText.map((char: string, index: number) => (
                  <span 
                    key={index}
                    className={`transition-opacity duration-200 ${index === 0 ? 'text-white font-bold' : 'opacity-50'}`}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SplitStellar Hardware Keyboard Deck */}
      <div className={`w-full transition-all duration-500 ${isFinished ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <VirtualKeyboard state={state} />
      </div>
      
    </div>
  );
}

export default GameArea;
