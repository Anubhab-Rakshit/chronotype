import { useEffect, useState } from 'react';
import type { TypingGameState } from '../hooks/useTypingEngine';
import { CornerAnchors } from './CornerAnchors';

interface VirtualKeyboardProps {
  state: TypingGameState;
}

const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export function VirtualKeyboard({ state }: VirtualKeyboardProps) {
  const { characters, currentIndex, isStarted, isFinished, lastKeyPressed, lastKeyPressCorrect } = state;
  const targetChar = characters[currentIndex]?.toUpperCase() || '';
  
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toUpperCase();
      setPressedKey(key);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toUpperCase() === pressedKey) {
        setPressedKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressedKey]);

  return (
    <div className="glass-card p-6 sm:p-8 relative select-none w-full max-w-[720px] mx-auto">
      <CornerAnchors />
      
      <div className="flex flex-col gap-2.5 relative z-10">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex justify-center gap-2 sm:gap-2.5"
            style={{ 
              marginLeft: rowIndex === 1 ? '1.25rem' : rowIndex === 2 ? '2.5rem' : '0' 
            }}
          >
            {row.map(key => {
              const isTarget = isStarted && !isFinished && key === targetChar;
              const isPressed = pressedKey === key;
              const isLastHitError = lastKeyPressed === key && lastKeyPressCorrect === false;
              
              let keyStyle = "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl font-mono text-xs sm:text-sm transition-all duration-100 ";
              
              if (isLastHitError) {
                keyStyle += "error-glitch border border-red-500/80 bg-red-500/25 text-red-400";
              } else if (isPressed) {
                keyStyle += "bg-white text-black border border-white scale-95 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.4)]";
              } else if (isTarget) {
                keyStyle += "border border-emerald-500/80 bg-emerald-500/15 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.3)] animate-pulse";
              } else {
                keyStyle += "border border-white/10 bg-white/5 text-[#888] hover:border-white/20 hover:text-white shadow-[0_4px_0_rgba(0,0,0,0.4)]";
              }

              return (
                <div key={key} className={keyStyle}>
                  {key}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualKeyboard;
