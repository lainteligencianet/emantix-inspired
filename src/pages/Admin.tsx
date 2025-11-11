import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameService } from "@/services/gameService";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Key } from "lucide-react";

export default function Admin() {
  const [wordOfTheDay, setWordOfTheDay] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [gameDate, setGameDate] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadWordOfTheDay = async () => {
      setIsLoading(true);
      try {
        const gameService = GameService.getInstance();
        await gameService.loadWords();
        const word = gameService.getWordOfTheDay();
        const today = new Date().toISOString().split('T')[0];
        setWordOfTheDay(word);
        setGameDate(today);
      } catch (error) {
        console.error('Error loading word of the day:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWordOfTheDay();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al juego
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Información del juego del día
          </p>
        </div>

        {isLoading ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              Cargando...
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Fecha:</span>
                  <span className="font-semibold text-foreground">{gameDate}</span>
                </div>
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Key className="h-5 w-5" />
                  <span className="text-sm">Palabra del día:</span>
                  <span className="text-2xl font-bold text-primary uppercase">
                    {wordOfTheDay}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-muted/30">
              <h2 className="font-semibold mb-4">Información técnica</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• La palabra del día se genera usando la fecha actual como semilla</p>
                <p>• Cada día la palabra cambia automáticamente a medianoche</p>
                <p>• El algoritmo asegura que la misma palabra aparezca para todos los jugadores</p>
                <p>• La selección es aleatoria pero determinística basada en la fecha</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
