export interface GameGuess {
  word: string;
  score: number;
  timestamp: Date;
}

export interface GameState {
  guesses: GameGuess[];
  currentWord: string;
  isComplete: boolean;
  gameDate: string;
}

export class GameService {
  private static instance: GameService;
  private words: string[] = [];
  private currentWord: string = '';
  private gameDate: string = '';

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  async loadWords(): Promise<void> {
    try {
      const response = await fetch('/data/mots.txt');
      const text = await response.text();
      this.words = text.split('\n').filter(word => word.trim().length > 0);
    } catch (error) {
      console.error('Error loading words:', error);
      // Fallback words in case of error
      this.words = ['casa', 'perro', 'gato', 'agua', 'fuego', 'tiempo', 'vida', 'amor'];
    }
  }

  getWordOfTheDay(): string {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.gameDate !== today || !this.currentWord) {
      this.gameDate = today;
      // Use date as seed for consistent daily word
      const seed = this.dateToSeed(today);
      const index = seed % this.words.length;
      this.currentWord = this.words[index];
    }
    
    return this.currentWord;
  }

  private dateToSeed(dateString: string): number {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  calculateScore(guess: string, target: string): number {
    // Factice scoring system - will be replaced with semantic similarity later
    let score = 0;
    
    // Perfect match
    if (guess.toLowerCase() === target.toLowerCase()) {
      return 100;
    }
    
    // Length similarity (up to 20 points)
    const lengthDiff = Math.abs(guess.length - target.length);
    score += Math.max(0, 20 - lengthDiff * 2);
    
    // Common letters (up to 30 points)
    const guessChars = guess.toLowerCase().split('');
    const targetChars = target.toLowerCase().split('');
    const commonChars = guessChars.filter(char => targetChars.includes(char));
    score += Math.min(30, commonChars.length * 3);
    
    // Position-based scoring (up to 25 points)
    let positionScore = 0;
    for (let i = 0; i < Math.min(guess.length, target.length); i++) {
      if (guess[i].toLowerCase() === target[i].toLowerCase()) {
        positionScore += 5;
      }
    }
    score += Math.min(25, positionScore);
    
    // First letter bonus (up to 10 points)
    if (guess[0]?.toLowerCase() === target[0]?.toLowerCase()) {
      score += 10;
    }
    
    // Last letter bonus (up to 5 points)
    if (guess[guess.length - 1]?.toLowerCase() === target[target.length - 1]?.toLowerCase()) {
      score += 5;
    }
    
    // Contains target substring (up to 15 points)
    if (guess.toLowerCase().includes(target.slice(0, 3).toLowerCase()) || 
        target.toLowerCase().includes(guess.slice(0, 3).toLowerCase())) {
      score += 15;
    }
    
    return Math.min(99, Math.max(0, score)); // Cap at 99 to reserve 100 for perfect match
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-medium';
    if (score >= 20) return 'score-low';
    return 'score-poor';
  }

  getScoreLabel(score: number): string {
    if (score === 100) return 'PERFECTO!';
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bien';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Lejos';
    return 'Muy lejos';
  }
}