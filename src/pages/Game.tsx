import { useGame } from "../hooks/useGame";
import { GameHeader } from "../components/game/GameHeader";
import { GuessInput } from "../components/game/GuessInput";
import { GuessHistory } from "../components/game/GuessHistory";
import { GameRules } from "../components/game/GameRules";
import { AnimatedGuess } from "../components/game/AnimatedGuess";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Brain } from "lucide-react";
import { useState, useEffect } from "react";

const Game = () => {
  const { gameState, isLoading, makeGuess, resetGame, gameService } = useGame();
  const [animatingGuess, setAnimatingGuess] = useState<any>(null);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    const checkModel = setInterval(() => {
      if (gameService.isModelReady()) {
        setModelReady(true);
        clearInterval(checkModel);
      }
    }, 500);
    return () => clearInterval(checkModel);
  }, [gameService]);

  const handleGuess = async (word: string) => {
    // Check for duplicate first
    if (gameState.guesses.some(g => g.word.toLowerCase() === word.toLowerCase())) {
      toast({
        title: "Palabra repetida",
        description: "Ya has probado esta palabra.",
        variant: "destructive"
      });
      return;
    }

    const result = await makeGuess(word);
    
    // Check if word is invalid
    if (result && 'error' in result) {
      toast({
        title: "Palabra no conocida",
        description: "Esta palabra no está en nuestro diccionario español.",
        variant: "destructive"
      });
      return;
    }

    // Get the latest guess after making it (we'll need to wait a bit for state update)
    setTimeout(() => {
      const lastGuess = gameState.guesses[0];
      if (lastGuess) {
        // Show animated guess
        setAnimatingGuess(lastGuess);
        
        // Show encouragement based on score
        if (lastGuess.score === 1000) {
          setTimeout(() => {
            toast({
              title: "¡FELICIDADES! 🎉",
              description: "¡Has encontrado la palabra secreta!",
            });
          }, 2800);
        } else if (lastGuess.score >= 800) {
          setTimeout(() => {
            toast({
              title: "¡Muy cerca! 🔥",
              description: "Estás a punto de encontrarla.",
            });
          }, 2800);
        } else if (lastGuess.score >= 600) {
          setTimeout(() => {
            toast({
              title: "Bien 👍",
              description: "Vas por buen camino.",
            });
          }, 2800);
        }
      }
    }, 100);
  };

  const handleAnimationComplete = () => {
    setAnimatingGuess(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando el juego...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {animatingGuess && (
        <AnimatedGuess 
          guess={animatingGuess} 
          onAnimationComplete={handleAnimationComplete} 
        />
      )}
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <GameHeader 
          guessCount={gameState.guesses.length}
          isComplete={gameState.isComplete}
          targetWord={gameState.isComplete ? gameState.currentWord : undefined}
        />
        
        <GameRules />

        {!modelReady && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
            <Brain className="h-4 w-4" />
            <span>Cargando modelo semántico...</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        
        <GuessInput
          onGuess={handleGuess}
          disabled={gameState.isComplete}
        />
        
        <GuessHistory guesses={gameState.guesses} />
        
        {gameState.isComplete && (
          <div className="text-center mt-8">
            <p className="text-lg text-muted-foreground mb-4">
              ¡Juego completado! Vuelve mañana para una nueva palabra.
            </p>
            <Button 
              onClick={resetGame}
              variant="outline"
              className="hover:bg-primary/10"
            >
              Reiniciar juego de hoy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;