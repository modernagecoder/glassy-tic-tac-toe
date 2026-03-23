export type Player = 'X' | 'O' | null;

export interface UserProfile {
  nickname: string;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: any; // Firestore Timestamp
}

export interface GameState {
  id?: string;
  hostId: string;
  guestId: string | null;
  hostNickname: string;
  guestNickname: string | null;
  board: Player[];
  turn: 'X' | 'O';
  status: 'waiting' | 'playing' | 'finished';
  winner: string | 'draw' | null;
  createdAt: any;
  updatedAt: any;
}

export interface ChallengeRequest {
  id?: string;
  hostId: string;
  hostNickname: string;
  gameId: string;
  status: 'open' | 'accepted' | 'expired';
  createdAt: any;
  acceptedBy?: string;
  acceptedByNickname?: string;
  boardSize?: BoardSize;
}

export type BoardSize = 3 | 4 | 5;

export interface BoardConfig {
  size: BoardSize;
  cells: number;
  winLength: number;
  label: string;
  emoji: string;
  color: string;
  rules: string;
}

export const BOARD_CONFIGS: Record<BoardSize, BoardConfig> = {
  3: { size: 3, cells: 9,  winLength: 3, label: 'Easy',   emoji: '🟢', color: 'emerald', rules: '3×3 board · Get 3 in a row' },
  4: { size: 4, cells: 16, winLength: 4, label: 'Medium', emoji: '🟡', color: 'amber',   rules: '4×4 board · Get 4 in a row' },
  5: { size: 5, cells: 25, winLength: 4, label: 'Hard',   emoji: '🔴', color: 'rose',    rules: '5×5 board · Get 4 in a row' },
};

export function generateWinCombinations(size: BoardSize): number[][] {
  const winLen = BOARD_CONFIGS[size].winLength;
  const combos: number[][] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLen; col++) {
      combos.push(Array.from({ length: winLen }, (_, i) => row * size + col + i));
    }
  }
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLen; row++) {
      combos.push(Array.from({ length: winLen }, (_, i) => (row + i) * size + col));
    }
  }
  for (let row = 0; row <= size - winLen; row++) {
    for (let col = 0; col <= size - winLen; col++) {
      combos.push(Array.from({ length: winLen }, (_, i) => (row + i) * size + (col + i)));
    }
  }
  for (let row = 0; row <= size - winLen; row++) {
    for (let col = winLen - 1; col < size; col++) {
      combos.push(Array.from({ length: winLen }, (_, i) => (row + i) * size + (col - i)));
    }
  }

  return combos;
}
