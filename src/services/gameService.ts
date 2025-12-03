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
  private words: string[] = []; // Words for daily word selection
  private dictionary: Set<string> = new Set(); // Full Spanish dictionary for validation
  private currentWord: string = '';
  private gameDate: string = '';
  private embeddings: Map<string, number[]> = new Map();
  private pipeline: any = null;
  private modelReady: boolean = false;
  private modelLoading: boolean = false;
  private modelLoadPromise: Promise<void> | null = null;

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  isModelReady(): boolean {
    return this.modelReady;
  }

  isModelLoading(): boolean {
    return this.modelLoading;
  }

  async loadWords(): Promise<void> {
    try {
      // Load the daily words list (504 words for daily selection)
      const responseDaily = await fetch('/data/palabras.txt');
      const textDaily = await responseDaily.text();
      this.words = textDaily.split('\n')
        .filter(line => line.trim().length > 0)
        .map(word => word.trim());
      
      // Load the complete Spanish dictionary for validation
      console.log('📚 Cargando diccionario completo...');
      const responseDictionary = await fetch('/data/diccionario-completo.txt');
      const textDictionary = await responseDictionary.text();
      const dictionaryWords = textDictionary.split('\n')
        .filter(line => line.trim().length > 0)
        .map(word => this.normalizeWord(word.trim()));
      
      this.dictionary = new Set(dictionaryWords);
      console.log(`✅ Diccionario cargado: ${this.dictionary.size} palabras`);
      
      // Initialize embeddings model in background (non-blocking)
      this.initializeEmbeddings();
    } catch (error) {
      console.error('Error loading words:', error);
      // Fallback words in case of error
      this.words = ['casa', 'perro', 'gato', 'agua', 'fuego', 'tiempo', 'vida', 'amor'];
    }
  }

  private normalizeWord(word: string): string {
    return word.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  isValidWord(word: string): boolean {
    const normalized = this.normalizeWord(word);
    // Check if word is in the complete Spanish dictionary
    const isValid = this.dictionary.has(normalized);
    if (!isValid) {
      console.log(`❌ Palabra no encontrada en el diccionario: ${word}`);
    }
    return isValid;
  }

  private async initializeEmbeddings(): Promise<void> {
    if (this.modelLoading || this.modelReady) return;
    
    this.modelLoading = true;
    this.modelLoadPromise = this._loadModel();
    
    try {
      await this.modelLoadPromise;
    } finally {
      this.modelLoading = false;
    }
  }

  private async _loadModel(): Promise<void> {
    try {
      console.log('🔄 Iniciando carga del modelo de embeddings...');
      const { pipeline } = await import('@huggingface/transformers');
      
      console.log('📦 Cargando modelo multilingual (esto puede tardar 1-2 minutos la primera vez)...');
      this.pipeline = await pipeline(
        'feature-extraction',
        'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
        { 
          device: 'webgpu',
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              console.log(`⏳ Descargando: ${progress.file} - ${Math.round(progress.progress || 0)}%`);
            } else if (progress.status === 'done') {
              console.log(`✅ Completado: ${progress.file}`);
            }
          }
        }
      );
      
      console.log('✅ Modelo cargado! Calculando embeddings para las palabras del juego...');
      // Compute embeddings for all words in batches
      const batchSize = 25;
      for (let i = 0; i < this.words.length; i += batchSize) {
        const batch = this.words.slice(i, i + batchSize);
        const embeddings = await this.pipeline(batch, { pooling: 'mean', normalize: true });
        
        batch.forEach((word, idx) => {
          this.embeddings.set(this.normalizeWord(word), Array.from(embeddings[idx].data));
        });
        
        // Show progress every 100 words
        const progress = Math.min(i + batchSize, this.words.length);
        console.log(`📊 Embeddings: ${progress}/${this.words.length} palabras procesadas`);
      }
      
      this.modelReady = true;
      console.log(`🎉 ¡Modelo semántico listo! ${this.embeddings.size} palabras con embeddings`);
    } catch (error) {
      console.error('❌ Error inicializando embeddings:', error);
      
      // Try fallback to WASM if WebGPU fails
      try {
        console.log('🔄 Intentando con WASM como alternativa...');
        const { pipeline } = await import('@huggingface/transformers');
        this.pipeline = await pipeline(
          'feature-extraction',
          'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
          { device: 'wasm' }
        );
        
        // Compute embeddings with smaller batches for WASM
        const batchSize = 10;
        for (let i = 0; i < this.words.length; i += batchSize) {
          const batch = this.words.slice(i, i + batchSize);
          const embeddings = await this.pipeline(batch, { pooling: 'mean', normalize: true });
          
          batch.forEach((word, idx) => {
            this.embeddings.set(this.normalizeWord(word), Array.from(embeddings[idx].data));
          });
        }
        
        this.modelReady = true;
        console.log(`🎉 ¡Modelo semántico listo (WASM)! ${this.embeddings.size} palabras`);
      } catch (fallbackError) {
        console.error('❌ Error con WASM también:', fallbackError);
        console.log('⚠️ El juego usará puntuación simple (menos precisa)');
      }
    }
  }

  async waitForModel(): Promise<boolean> {
    if (this.modelReady) return true;
    if (this.modelLoadPromise) {
      await this.modelLoadPromise;
    }
    return this.modelReady;
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
    const guessNormalized = this.normalizeWord(guess);
    const targetNormalized = this.normalizeWord(target);
    
    // Perfect match (ignoring accents)
    if (guessNormalized === targetNormalized) {
      console.log(`🎯 ¡Palabra exacta! ${guess}`);
      return 1000;
    }

    // Try semantic similarity if embeddings are available
    if (this.pipeline && this.embeddings.has(targetNormalized)) {
      try {
        // Get or compute embedding for the guess
        let guessEmbedding: number[];
        if (this.embeddings.has(guessNormalized)) {
          console.log(`📚 Usando embedding precalculado para: ${guess}`);
          guessEmbedding = this.embeddings.get(guessNormalized)!;
        } else {
          console.log(`🔄 Calculando embedding para palabra nueva: ${guess}`);
          const embeddings = await this.pipeline([guess], { pooling: 'mean', normalize: true });
          guessEmbedding = Array.from(embeddings[0].data);
        }
        
        const targetEmbedding = this.embeddings.get(targetNormalized)!;
        
        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(guessEmbedding, targetEmbedding);
        
        // Convert similarity (-1 to 1) to score (0 to 999)
        const score = Math.round(((similarity + 1) / 2) * 999);
        console.log(`🔢 Similaridad semántica entre "${guess}" y "${target}": ${similarity.toFixed(4)} → Score: ${score}`);
        return Math.max(0, Math.min(999, score));
        
      } catch (error) {
        console.error('❌ Error calculando similaridad semántica:', error);
        console.log('⚠️ Usando puntuación simple');
      }
    } else if (!this.pipeline) {
      console.log('⚠️ Modelo de embeddings no disponible, usando puntuación simple');
    }

    // Fallback to simple scoring
    const simpleScore = this.calculateSimpleScore(guess, target);
    console.log(`📊 Puntuación simple para "${guess}": ${simpleScore}`);
    return simpleScore;
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