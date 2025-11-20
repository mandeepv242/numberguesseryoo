export enum GamePhase {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export enum ClueType {
  PARITY = 'PARITY', // Even/Odd
  PRIME = 'PRIME', // Is Prime?
  DIVISIBLE_3 = 'DIVISIBLE_3', // Divisible by 3?
  SUM_DIGITS = 'SUM_DIGITS', // Sum of digits
}

export interface GameConfig {
  min: number;
  max: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  maxGuesses: number;
  smartMode: boolean;
  playerName: string;
}

export interface GameState {
  secretNumber: number;
  guesses: number[];
  rangeLow: number;
  rangeHigh: number;
  score: number;
  unlockedClues: ClueType[];
  startTime: number;
}

export interface AnalysisResult {
  feedback: string;
  rating: number; // 1-5 stars
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  difficulty: string;
  guesses: number;
  date: number;
}