import { ClueType } from '../types';

export const isPrime = (num: number): boolean => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

export const getDigitSum = (num: number): number => {
  return num
    .toString()
    .split('')
    .reduce((acc, curr) => acc + parseInt(curr, 10), 0);
};

export const getClueCost = (type: ClueType): number => {
  switch (type) {
    case ClueType.PARITY: return 50;
    case ClueType.DIVISIBLE_3: return 75;
    case ClueType.PRIME: return 100;
    case ClueType.SUM_DIGITS: return 150;
    default: return 0;
  }
};

export const getClueText = (type: ClueType, secret: number): string => {
  switch (type) {
    case ClueType.PARITY:
      return secret % 2 === 0 ? "The number is Even." : "The number is Odd.";
    case ClueType.PRIME:
      return isPrime(secret) ? "The number is Prime." : "The number is Composite (not prime).";
    case ClueType.DIVISIBLE_3:
      return secret % 3 === 0 ? "The number is divisible by 3." : "The number is NOT divisible by 3.";
    case ClueType.SUM_DIGITS:
      return `The sum of the digits is ${getDigitSum(secret)}.`;
    default:
      return "";
  }
};

// Optimal binary search pivot
export const getBinarySearchPivot = (low: number, high: number): number => {
  return Math.floor((low + high) / 2);
};

// Calculate expected guesses using Binary Search (log2)
export const calculateExpectedGuesses = (min: number, max: number): number => {
  const range = max - min + 1;
  return Math.ceil(Math.log2(range));
};

export const calculateScore = (
  guessesTaken: number,
  rangeSize: number,
  cluePenalty: number,
  timeSeconds: number
): number => {
  const expected = Math.ceil(Math.log2(rangeSize));
  const baseScore = 1000;
  
  // Penalty for extra guesses beyond expected
  const guessPenalty = Math.max(0, (guessesTaken - expected) * 100);
  
  // Time penalty (small)
  const timePenalty = Math.floor(timeSeconds * 2);

  return Math.max(0, baseScore - guessPenalty - cluePenalty - timePenalty);
};
