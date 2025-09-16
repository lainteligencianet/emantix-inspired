import { useState, useEffect, useCallback } from 'react';
import { GameService, GameGuess, GameState } from '../services/gameService';

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    currentWord: '',
    isComplete: false,
    gameDate: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const gameService = GameService.getInstance();

  useEffect(() => {
    initGame();
  }, []);

  const initGame = async () => {
    setIsLoading(true);
    try {
      await gameService.loadWords();
      const wordOfTheDay = gameService.getWordOfTheDay();
      const today = new Date().toISOString().split('T')[0];
      
      // Load saved game state for today
      const savedState = localStorage.getItem(`cemantix-es-${today}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setGameState({
          ...parsed,
          guesses: parsed.guesses.map((g: any) => ({
            ...g,
            timestamp: new Date(g.timestamp)
          }))
        });
      } else {
        setGameState({
          guesses: [],
          currentWord: wordOfTheDay,
          isComplete: false,
          gameDate: today
        });
      }
    } catch (error) {
      console.error('Error initializing game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameState = useCallback((state: GameState) => {
    localStorage.setItem(`cemantix-es-${state.gameDate}`, JSON.stringify(state));
  }, []);

  const makeGuess = useCallback(async (word: string) => {
    if (!word.trim() || gameState.isComplete) return;
    
    const normalizedWord = word.trim().toLowerCase();
    
    // Check if word already guessed
    if (gameState.guesses.some(g => g.word.toLowerCase() === normalizedWord)) {
      return;
    }

    const score = await gameService.calculateScore(normalizedWord, gameState.currentWord);
    const newGuess: GameGuess = {
      word: normalizedWord,
      score,
      timestamp: new Date()
    };

    const newState: GameState = {
      ...gameState,
      guesses: [...gameState.guesses, newGuess].sort((a, b) => b.score - a.score),
      isComplete: score === 100
    };

    setGameState(newState);
    saveGameState(newState);
  }, [gameState, gameService, saveGameState]);

  const resetGame = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`cemantix-es-${today}`);
    initGame();
  }, []);

  return {
    gameState,
    isLoading,
    makeGuess,
    resetGame,
    gameService
  };
};