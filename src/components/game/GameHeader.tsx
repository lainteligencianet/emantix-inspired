import { Card } from "@/components/ui/card";

interface GameHeaderProps {
  guessCount: number;
  isComplete: boolean;
  targetWord?: string;
}

export const GameHeader = ({ guessCount, isComplete, targetWord }: GameHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
        Palabra Gurú
      </h1>
      <p className="text-muted-foreground mb-4">
        Encuentra la palabra secreta usando la similaridad semántica
      </p>
      
      <Card className="inline-block px-6 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Intentos:</span>
          <span className="font-bold text-primary">{guessCount}</span>
          {isComplete && targetWord && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-green-600 font-bold">¡Palabra encontrada: {targetWord.toUpperCase()}!</span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};