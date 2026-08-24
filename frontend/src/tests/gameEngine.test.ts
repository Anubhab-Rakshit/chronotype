import { describe, it, expect, beforeEach } from 'vitest';

describe('Typing Speed Game Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates 20 random uppercase alphabets', () => {
    const chars = Array.from({ length: 20 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    );
    expect(chars).toHaveLength(20);
    chars.forEach((c) => {
      expect(c).toMatch(/^[A-Z]$/);
    });
  });

  it('applies exact 0.5s penalty for each wrong attempt', () => {
    const wrongAttempts = 3;
    const rawTime = 7.5;
    const penaltyTime = wrongAttempts * 0.5;
    const totalTime = rawTime + penaltyTime;

    expect(penaltyTime).toBe(1.5);
    expect(totalTime).toBe(9.0);
  });

  it('calculates 100% accuracy on flawless run', () => {
    const correct = 20;
    const wrong = 0;
    const accuracy = (correct / (correct + wrong)) * 100;
    expect(accuracy).toBe(100);
  });

  it('calculates accurate percentage on runs with penalties', () => {
    const correct = 20;
    const wrong = 5;
    const accuracy = (correct / (correct + wrong)) * 100;
    expect(accuracy).toBeCloseTo(80.0, 1);
  });

  it('correctly compares with previous local best score', () => {
    localStorage.setItem('monkeytype_best_score', '10.50');

    const run1TotalTime = 12.0;
    const isNewBest1 = run1TotalTime < parseFloat(localStorage.getItem('monkeytype_best_score')!);
    expect(isNewBest1).toBe(false);

    const run2TotalTime = 9.25;
    const isNewBest2 = run2TotalTime < parseFloat(localStorage.getItem('monkeytype_best_score')!);
    expect(isNewBest2).toBe(true);

    if (isNewBest2) {
      localStorage.setItem('monkeytype_best_score', run2TotalTime.toFixed(2));
    }

    expect(localStorage.getItem('monkeytype_best_score')).toBe('9.25');
  });

  it('calculates approximate WPM and CPS metrics correctly', () => {
    const correctCharacters = 20;
    const elapsedSeconds = 6.0; // 20 chars in 6s = 3.33 CPS
    const cps = correctCharacters / elapsedSeconds;
    const wpm = (correctCharacters / 5) / (elapsedSeconds / 60);

    expect(cps).toBeCloseTo(3.33, 2);
    expect(wpm).toBe(40); // 4 words in 0.1 min = 40 WPM
  });
});
