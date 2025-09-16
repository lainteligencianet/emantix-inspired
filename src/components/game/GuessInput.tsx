import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface GuessInputProps {
  onGuess: (word: string) => void;
  disabled?: boolean;
}

export const GuessInput = ({ onGuess, disabled = false }: GuessInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onGuess(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-card to-secondary/20">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribe tu palabra..."
          disabled={disabled}
          className="flex-1 text-lg py-3 transition-all duration-300 focus:ring-2 focus:ring-primary/50"
          autoComplete="off"
          autoFocus
        />
        <Button 
          type="submit" 
          disabled={disabled || !inputValue.trim()}
          className="px-8 py-3 text-lg font-medium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105"
        >
          Probar
        </Button>
      </form>
    </Card>
  );
};