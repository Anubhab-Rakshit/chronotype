import { useState, useEffect, useCallback, useRef } from 'react';
import { apolloClient } from '../graphql/client';
import { SUBMIT_GAME_MUTATION } from '../graphql/operations';

export interface TypingGameState {
  characters: string[];
  currentIndex: number;
  rawStartTime: number | null;
  rawElapsedTime: number;
  penaltyTime: number;
  totalTime: number;
  wrongAttempts: number;
  correctCharacters: number;
  accuracy: number;
  wpm: number;
  cps: number;
  streak: number;
  maxStreak: number;
  isStarted: boolean;
  isFinished: boolean;
  isNewBest: boolean;
  isSubmittingToCloud: boolean;
  cloudSaved: boolean;
  penaltyFlash: boolean;
  penaltyFloater: { id: number; text: string } | null;
  lastKeyPressed: string | null;
  lastKeyPressCorrect: boolean | null;
  lastKeyPressTimestamp: number;
}

const generateCharacters = (): string[] => {
  return Array.from({ length: 20 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  );
};

export function useTypingEngine(
  playSound: (type: 'click' | 'error' | 'success') => void
) {
  const [state, setState] = useState<TypingGameState>({
    characters: generateCharacters(),
    currentIndex: 0,
    rawStartTime: null,
    rawElapsedTime: 0,
    penaltyTime: 0,
    totalTime: 0,
    wrongAttempts: 0,
    correctCharacters: 0,
    accuracy: 100,
    wpm: 0,
    cps: 0,
    streak: 0,
    maxStreak: 0,
    isStarted: false,
    isFinished: false,
    isNewBest: false,
    isSubmittingToCloud: false,
    cloudSaved: false,
    penaltyFlash: false,
    penaltyFloater: null,
    lastKeyPressed: null,
    lastKeyPressCorrect: null,
    lastKeyPressTimestamp: 0,
  });

  const [floaterIdCounter, setFloaterIdCounter] = useState<number>(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // High-precision RAF loop
  useEffect(() => {
    let animationFrameId: number;

    const updateTimer = () => {
      if (stateRef.current.rawStartTime && !stateRef.current.isFinished) {
        const now = performance.now();
        const elapsed = (now - stateRef.current.rawStartTime) / 1000;
        const total = elapsed + stateRef.current.penaltyTime;
        const currentCps = elapsed > 0 ? stateRef.current.correctCharacters / elapsed : 0;
        const currentWpm = elapsed > 0 ? (stateRef.current.correctCharacters / 5) / (elapsed / 60) : 0;

        setState((prev) => ({
          ...prev,
          rawElapsedTime: elapsed,
          totalTime: total,
          cps: Math.round(currentCps * 10) / 10,
          wpm: Math.round(currentWpm),
        }));

        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (state.isStarted && !state.isFinished) {
      animationFrameId = requestAnimationFrame(updateTimer);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [state.isStarted, state.isFinished]);

  // Submit to GraphQL backend on completion
  const submitToBackend = useCallback(async (finalState: TypingGameState) => {
    const token = localStorage.getItem('monkeytype_token');
    if (!token) return;

    setState((prev) => ({ ...prev, isSubmittingToCloud: true }));
    try {
      const { data } = await apolloClient.mutate<any>({
        mutation: SUBMIT_GAME_MUTATION,
        variables: {
          input: {
            totalTime: parseFloat(finalState.totalTime.toFixed(2)),
            rawTime: parseFloat(finalState.rawElapsedTime.toFixed(2)),
            penaltyTime: parseFloat(finalState.penaltyTime.toFixed(1)),
            wrongAttempts: finalState.wrongAttempts,
            correctCharacters: finalState.correctCharacters,
            accuracy: parseFloat(finalState.accuracy.toFixed(1)),
          },
        },
      });

      if (data?.submitGameResult) {
        setState((prev) => ({
          ...prev,
          isSubmittingToCloud: false,
          cloudSaved: true,
          isNewBest: data.submitGameResult.isBestScore || prev.isNewBest,
        }));
      }
    } catch (err) {
      console.warn('Error submitting game score to GraphQL Yoga:', err);
      setState((prev) => ({ ...prev, isSubmittingToCloud: false }));
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when focused in inputs or textareas (e.g. Auth modal)
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Escape' || (e.key === 'Enter' && e.ctrlKey)) {
        return; // Handled by outer restart handler
      }

      if (stateRef.current.isFinished) return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length !== 1) return;

      const key = e.key.toUpperCase();
      const isAlphabet = /^[A-Z]$/.test(key);
      if (!isAlphabet) return;

      // Start game on first valid keypress
      let startTime = stateRef.current.rawStartTime;
      if (!stateRef.current.isStarted) {
        startTime = performance.now();
        setState((prev) => ({
          ...prev,
          isStarted: true,
          rawStartTime: startTime,
        }));
      }

      const targetChar = stateRef.current.characters[stateRef.current.currentIndex];
      const nowTime = Date.now();

      if (key === targetChar) {
        // Correct keystroke
        playSound('click');
        const nextIndex = stateRef.current.currentIndex + 1;
        const isFinishing = nextIndex === 20;

        setState((prev) => {
          const newCorrect = prev.correctCharacters + 1;
          const newStreak = prev.streak + 1;
          const newMaxStreak = Math.max(prev.maxStreak, newStreak);
          const totalAttempts = newCorrect + prev.wrongAttempts;
          const newAccuracy = totalAttempts > 0 ? (newCorrect / totalAttempts) * 100 : 100;
          const finalRawTime = startTime ? (performance.now() - startTime) / 1000 : prev.rawElapsedTime;
          const finalTotalTime = finalRawTime + prev.penaltyTime;

          let newBestScoreFlag = prev.isNewBest;
          if (isFinishing) {
            playSound('success');
            const localBest = localStorage.getItem('monkeytype_best_score');
            if (!localBest || finalTotalTime < parseFloat(localBest)) {
              newBestScoreFlag = true;
              localStorage.setItem('monkeytype_best_score', finalTotalTime.toFixed(2));
            }
          }

          const updatedState: TypingGameState = {
            ...prev,
            currentIndex: nextIndex,
            correctCharacters: newCorrect,
            streak: newStreak,
            maxStreak: newMaxStreak,
            accuracy: newAccuracy,
            isFinished: isFinishing,
            isNewBest: newBestScoreFlag,
            lastKeyPressed: key,
            lastKeyPressCorrect: true,
            lastKeyPressTimestamp: nowTime,
          };

          if (isFinishing) {
            submitToBackend(updatedState);
          }

          return updatedState;
        });
      } else {
        // Wrong keystroke: Apply strict 0.5s penalty
        playSound('error');
        setFloaterIdCounter((id) => id + 1);

        setState((prev) => {
          const newWrong = prev.wrongAttempts + 1;
          const totalAttempts = prev.correctCharacters + newWrong;
          const newAccuracy = totalAttempts > 0 ? (prev.correctCharacters / totalAttempts) * 100 : 100;
          const newPenalty = prev.penaltyTime + 0.5;

          return {
            ...prev,
            wrongAttempts: newWrong,
            streak: 0, // Reset streak
            accuracy: newAccuracy,
            penaltyTime: newPenalty,
            totalTime: prev.rawElapsedTime + newPenalty,
            penaltyFlash: true,
            penaltyFloater: { id: floaterIdCounter, text: '+0.5s PENALTY' },
            lastKeyPressed: key,
            lastKeyPressCorrect: false,
            lastKeyPressTimestamp: nowTime,
          };
        });

        setTimeout(() => {
          setState((prev) => ({ ...prev, penaltyFlash: false }));
        }, 300);
      }
    },
    [playSound, floaterIdCounter, submitToBackend]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const restart = useCallback(() => {
    setState({
      characters: generateCharacters(),
      currentIndex: 0,
      rawStartTime: null,
      rawElapsedTime: 0,
      penaltyTime: 0,
      totalTime: 0,
      wrongAttempts: 0,
      correctCharacters: 0,
      accuracy: 100,
      wpm: 0,
      cps: 0,
      streak: 0,
      maxStreak: 0,
      isStarted: false,
      isFinished: false,
      isNewBest: false,
      isSubmittingToCloud: false,
      cloudSaved: false,
      penaltyFlash: false,
      penaltyFloater: null,
      lastKeyPressed: null,
      lastKeyPressCorrect: null,
      lastKeyPressTimestamp: 0,
    });
  }, []);

  return { state, restart };
}
