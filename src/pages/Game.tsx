import { useGame } from "../hooks/useGame";
import { GameHeader } from "../components/game/GameHeader";
import { GuessInput } from "../components/game/GuessInput";
import { GuessHistory } from "../components/game/GuessHistory";
import { GameRules } from "../components/game/GameRules";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Game = () => {
  const { gameState, isLoading, makeGuess, resetGame } = useGame();

  const handleGuess = (word: string) => {
    makeGuess(word);
    
    if (gameState.guesses.some(g => g.word.toLowerCase() === word.toLowerCase())) {
      toast({
        title: "Palabra repetida",
        description: "Ya has probado esta palabra.",
        variant: "destructive"
      });
      return;
    }
    
    // Show encouragement based on score
    const lastGuess = gameState.guesses[0];
    if (lastGuess?.score === 100) {
      toast({
        title: "¡FELICIDADES! 🎉",
        description: "¡Has encontrado la palabra secreta!",
      });
    } else if (lastGuess?.score >= 80) {
      toast({
        title: "¡Muy cerca! 🔥",
        description: "Estás a punto de encontrarla.",
      });
    } else if (lastGuess?.score >= 60) {
      toast({
        title: "Bien 👍",
        description: "Vas por buen camino.",
      });
    }
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
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <GameHeader 
          guessCount={gameState.guesses.length}
          isComplete={gameState.isComplete}
          targetWord={gameState.isComplete ? gameState.currentWord : undefined}
        />
        
        <GameRules />
        
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