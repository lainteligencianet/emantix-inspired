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
  private embeddings: Map<string, number[]> = new Map();
  private pipeline: any = null;

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  async loadWords(): Promise<void> {
    try {
      const response = await fetch('/data/palabras.txt');
      const text = await response.text();
      // Parse the numbered format: "1: palabra"
      this.words = text.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.split(': ')[1])
        .filter(word => word && word.trim().length > 0)
        .map(word => word.trim());
      
      // Initialize embeddings model
      await this.initializeEmbeddings();
    } catch (error) {
      console.error('Error loading words:', error);
      // Fallback words in case of error
      this.words = ['casa', 'perro', 'gato', 'agua', 'fuego', 'tiempo', 'vida', 'amor'];
    }
  }

  private async initializeEmbeddings(): Promise<void> {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      
      console.log('Loading embeddings model...');
      this.pipeline = await pipeline(
        'feature-extraction',
        'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
        { device: 'cpu' }
      );
      
      console.log('Computing embeddings for all words...');
      // Compute embeddings for all words in batches
      const batchSize = 50;
      for (let i = 0; i < this.words.length; i += batchSize) {
        const batch = this.words.slice(i, i + batchSize);
        const embeddings = await this.pipeline(batch, { pooling: 'mean', normalize: true });
        
        batch.forEach((word, idx) => {
          this.embeddings.set(word.toLowerCase(), Array.from(embeddings[idx].data));
        });
        
        // Show progress
        if (i % 100 === 0) {
          console.log(`Processed ${Math.min(i + batchSize, this.words.length)}/${this.words.length} words`);
        }
      }
      
      console.log('Embeddings ready!');
    } catch (error) {
      console.error('Error initializing embeddings:', error);
      console.log('Falling back to simple scoring...');
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

  async calculateScore(guess: string, target: string): Promise<number> {
    const guessLower = guess.toLowerCase();
    const targetLower = target.toLowerCase();
    
    // Perfect match
    if (guessLower === targetLower) {
      return 1000;
    }

    // Try semantic similarity if embeddings are available
    if (this.pipeline && this.embeddings.has(targetLower)) {
      try {
        // Get or compute embedding for the guess
        let guessEmbedding: number[];
        if (this.embeddings.has(guessLower)) {
          guessEmbedding = this.embeddings.get(guessLower)!;
        } else {
          const embeddings = await this.pipeline([guess], { pooling: 'mean', normalize: true });
          guessEmbedding = Array.from(embeddings[0].data);
        }
        
        const targetEmbedding = this.embeddings.get(targetLower)!;
        
        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(guessEmbedding, targetEmbedding);
        
        // Convert similarity (-1 to 1) to score (0 to 999)
        const score = Math.round(((similarity + 1) / 2) * 999);
        return Math.max(0, Math.min(999, score));
        
      } catch (error) {
        console.error('Error calculating semantic similarity:', error);
      }
    }

    // Fallback to simple scoring
    return this.calculateSimpleScore(guess, target);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateSimpleScore(guess: string, target: string): number {
    let score = 0;
    
    // Length similarity (up to 200 points)
    const lengthDiff = Math.abs(guess.length - target.length);
    score += Math.max(0, 200 - lengthDiff * 20);
    
    // Common letters (up to 300 points)
    const guessChars = guess.toLowerCase().split('');
    const targetChars = target.toLowerCase().split('');
    const commonChars = guessChars.filter(char => targetChars.includes(char));
    score += Math.min(300, commonChars.length * 30);
    
    // Position-based scoring (up to 250 points)
    let positionScore = 0;
    for (let i = 0; i < Math.min(guess.length, target.length); i++) {
      if (guess[i].toLowerCase() === target[i].toLowerCase()) {
        positionScore += 50;
      }
    }
    score += Math.min(250, positionScore);
    
    // First letter bonus (up to 100 points)
    if (guess[0]?.toLowerCase() === target[0]?.toLowerCase()) {
      score += 100;
    }
    
    // Last letter bonus (up to 50 points)
    if (guess[guess.length - 1]?.toLowerCase() === target[target.length - 1]?.toLowerCase()) {
      score += 50;
    }
    
    // Contains target substring (up to 100 points)
    if (guess.toLowerCase().includes(target.slice(0, 3).toLowerCase()) || 
        target.toLowerCase().includes(guess.slice(0, 3).toLowerCase())) {
      score += 100;
    }
    
    return Math.min(999, Math.max(0, score));
  }

  getScoreColor(score: number): string {
    if (score >= 800) return 'score-excellent';
    if (score >= 600) return 'score-good';
    if (score >= 400) return 'score-medium';
    if (score >= 200) return 'score-low';
    return 'score-poor';
  }

  getScoreEmoji(score: number): string {
    if (score === 1000) return '🎉';
    if (score >= 900) return '🤩';
    if (score >= 800) return '😍';
    if (score >= 700) return '😊';
    if (score >= 600) return '🙂';
    if (score >= 500) return '😐';
    if (score >= 400) return '🤔';
    if (score >= 300) return '😕';
    if (score >= 200) return '😞';
    if (score >= 100) return '😫';
    return '🥶';
  }

  getScoreLabel(score: number): string {
    if (score === 1000) return 'PERFECTO!';
    if (score >= 800) return 'Excelente';
    if (score >= 600) return 'Bien';
    if (score >= 400) return 'Regular';
    if (score >= 200) return 'Lejos';
    return 'Muy lejos';
  }
}