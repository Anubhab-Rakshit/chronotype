class AudioEngine {
  private audioCtx: AudioContext | null = null;
  public isEnabled = true;

  private _initContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playTick() {
    if (!this.isEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, this.audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.06);
    } catch {
      // Ignore
    }
  }

  public playSuccess() {
    if (!this.isEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    try {
      const playTone = (freq: number, delay: number, duration: number) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + delay);

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + delay + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + delay + duration);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + delay);
        osc.stop(this.audioCtx.currentTime + delay + duration + 0.1);
      };

      playTone(523.25, 0, 0.4);    // C5
      playTone(659.25, 0.05, 0.4); // E5
      playTone(783.99, 0.1, 0.6);  // G5
    } catch {
      // Ignore
    }
  }

  public playError() {
    if (!this.isEnabled) return;
    this._initContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.12);

      gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.14);
    } catch {
      // Ignore
    }
  }

  public toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }
}

export const audio = new AudioEngine();
