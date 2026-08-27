import { useState, useEffect } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [step, setStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const logs = [
    "[SYS] INITIALIZING NEURAL LINK...",
    "[SYS] CALIBRATING HUD TELEMETRY...",
    "[SYS] ESTABLISHING SECURE CONNECTION...",
    "[SYS] SUB-SECOND ENGINE ONLINE."
  ];

  useEffect(() => {
    if (step < logs.length) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 400 + Math.random() * 400); // Random delay between 400ms and 800ms
      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
    }
  }, [step, logs.length]);

  useEffect(() => {
    if (!isReady) return;

    const handleKeyDown = () => {
      setIsFadingOut(true);
      setTimeout(onComplete, 800); // Wait for fade out animation
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-start gap-2 w-full max-w-md px-6 font-mono text-[10px] sm:text-xs tracking-widest text-[#00FFAA]/80">
        {logs.slice(0, step).map((log, i) => (
          <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {log}
          </div>
        ))}
        
        {step < logs.length && (
          <div className="animate-pulse">_</div>
        )}
      </div>

      {isReady && (
        <div className="absolute bottom-32 flex flex-col items-center gap-4 animate-in fade-in duration-700">
          <div className="text-[#888] font-mono text-[10px] tracking-[0.2em] uppercase">
            System Ready
          </div>
          <div className="px-6 py-2 border border-white/10 bg-white/5 rounded text-white font-mono text-xs tracking-widest animate-pulse">
            PRESS ANY KEY TO INITIALIZE
          </div>
        </div>
      )}
    </div>
  );
}
