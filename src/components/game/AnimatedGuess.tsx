import React, { useEffect, useState } from 'react';
import { GameGuess } from '@/services/gameService';
import { GameService } from '@/services/gameService';

interface AnimatedGuessProps {
  guess: GameGuess;
  onAnimationComplete: () => void;
}

export const AnimatedGuess = ({ guess, onAnimationComplete }: AnimatedGuessProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingDown, setIsAnimatingDown] = useState(false);
  const gameService = GameService.getInstance();

  useEffect(() => {
    // Show the guess at the top
    setIsVisible(true);
    
    // After 2 seconds, start the animation down
    const timer1 = setTimeout(() => {
      setIsAnimatingDown(true);
    }, 2000);

    // After animation completes, notify parent
    const timer2 = setTimeout(() => {
      onAnimationComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed top-20 left-1/2 transform -translate-x-1/2 z-50
        bg-card border border-border rounded-lg shadow-xl p-6
        transition-all duration-800 ease-in-out
        ${isAnimatingDown ? 'opacity-0 translate-y-96 scale-75' : 'opacity-100 translate-y-0 scale-100'}
      `}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{gameService.getScoreEmoji(guess.score)}</span>
        <div>
          <div className="text-2xl font-bold text-primary">{guess.word}</div>
          <div className="text-xl font-semibold">
            {guess.score}/1000 - {gameService.getScoreLabel(guess.score)}
          </div>
        </div>
      </div>
    </div>
  );
};