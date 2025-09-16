import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const GameRules = () => {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="mb-6">
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={() => setShowRules(!showRules)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showRules ? 'Ocultar reglas' : '¿Cómo jugar?'}
        </Button>
      </div>
      
      {showRules && (
        <Card className="mt-4 p-6 bg-muted/30">
          <div className="space-y-4 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground mb-3">Reglas del juego:</h3>
            
            <div className="space-y-2">
              <p>• Cada día hay una palabra secreta en español.</p>
              <p>• Escribe palabras para adivinar la palabra secreta.</p>
              <p>• Recibirás una puntuación de 0 a 100 basada en la similitud.</p>
              <p>• Cuanto mayor sea la puntuación, más cerca estás de la respuesta.</p>
              <p>• Tus intentos se ordenan automáticamente por puntuación.</p>
              <p>• ¡El objetivo es encontrar la palabra que da 100 puntos!</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs">
                <strong>Nota:</strong> Esta versión usa un sistema de puntuación simplificado. 
                En versiones futuras se implementará similaridad semántica real.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};