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
}
