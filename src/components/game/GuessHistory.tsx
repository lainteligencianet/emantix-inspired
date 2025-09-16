import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GameGuess } from "../../services/gameService";

interface GuessHistoryProps {
  guesses: GameGuess[];
}

export const GuessHistory = ({ guesses }: GuessHistoryProps) => {
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'hsl(142, 71%, 45%)'; // green
    if (score >= 60) return 'hsl(47, 96%, 53%)'; // yellow
    if (score >= 40) return 'hsl(25, 95%, 53%)'; // orange
    return 'hsl(0, 84%, 60%)'; // red
  };

  if (guesses.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>Aún no has hecho ningún intento.</p>
        <p className="text-sm mt-2">¡Empieza escribiendo una palabra en español!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Historial de intentos ({guesses.length})
      </h2>
      
      <div className="max-h-96 overflow-y-auto space-y-2">
        {guesses.map((guess, index) => {
          return (
            <Card 
              key={`${guess.word}-${guess.timestamp.getTime()}`}
              className={`p-4 transition-all duration-300 hover:scale-[1.02] ${
                guess.score === 100 ? 'ring-2 ring-green-400 bg-green-50' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-lg font-medium text-foreground min-w-[80px]">
                    {guess.word}
                  </span>
                  
                  <div className="flex-1 max-w-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{guess.score}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                    <Progress 
                      value={guess.score} 
                      className="h-3"
                      style={{
                        '--progress-background': getProgressColor(guess.score)
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground ml-4">
                  #{index + 1}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};