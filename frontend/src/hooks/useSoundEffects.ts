import { useCallback, useRef, useEffect, useState } from 'react';

export function useSoundEffects() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('monkeytype_muted') === 'true';
  });
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('monkeytype_volume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });

  useEffect(() => {
    localStorage.setItem('monkeytype_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('monkeytype_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('click', initAudio, { once: true });

    return () => {
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('click', initAudio);
    };
  }, []);

  const playSound = useCallback(
    (type: 'click' | 'error' | 'success') => {
      if (isMuted) return;

      let ctx = audioCtxRef.current;
      if (!ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx();
          audioCtxRef.current = ctx;
        }
      }
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const t = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, t);
      masterGain.connect(ctx.destination);

      if (type === 'click') {
        // High-end Mechanical "Thock" with slight pitch variation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        const basePitch = 280 + (Math.random() * 40 - 20); // 260Hz - 300Hz variation
        osc.type = 'sine';
        osc.frequency.setValueAtTime(basePitch, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.035);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.7, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.04);
      } else if (type === 'error') {
        // Sub-bass buzz with dissonance
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(110, t);
        osc2.frequency.setValueAtTime(118, t); // Dissonance

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.2);
        osc2.stop(t + 0.2);
      } else if (type === 'success') {
        // Multi-voice harmonic victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
        notes.forEach((freq, index) => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + index * 0.08);

          gain.gain.setValueAtTime(0, t + index * 0.08);
          gain.gain.linearRampToValueAtTime(0.25, t + index * 0.08 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, t + index * 0.08 + 0.55);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(t + index * 0.08);
          osc.stop(t + index * 0.08 + 0.6);
        });
      }
    },
    [isMuted, volume]
  );

  return { playSound, isMuted, setIsMuted, volume, setVolume };
}
