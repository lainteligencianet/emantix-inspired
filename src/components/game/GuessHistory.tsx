import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameGuess } from "../../services/gameService";
import { GameService } from "../../services/gameService";

interface GuessHistoryProps {
  guesses: GameGuess[];
}

export const GuessHistory = ({ guesses }: GuessHistoryProps) => {
  const gameService = GameService.getInstance();

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
          const scoreColor = gameService.getScoreColor(guess.score);
          const scoreLabel = gameService.getScoreLabel(guess.score);
          
          return (
            <Card 
              key={`${guess.word}-${guess.timestamp.getTime()}`}
              className={`p-4 transition-all duration-300 hover:scale-[1.02] ${
                guess.score === 100 ? 'ring-2 ring-green-400 bg-green-50' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-foreground">
                    {guess.word}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-${scoreColor} border-${scoreColor}/30 bg-${scoreColor}/10`}
                  >
                    {scoreLabel}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-2xl font-bold text-${scoreColor}`}>
                      {guess.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>
                  
                  <div 
                    className={`w-12 h-12 rounded-full bg-${scoreColor}/20 border-2 border-${scoreColor}/40 flex items-center justify-center`}
                  >
                    <div 
                      className={`w-8 h-8 rounded-full bg-${scoreColor}`}
                      style={{
                        transform: `scale(${Math.max(0.3, guess.score / 100)})`
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};