export type LeaderboardType = 'global' | 'collection' | 'battle';

export interface LeaderboardEntry {
  userId: string;
  name: string | null;
  picture: string | null;
  score: number;
  rank: number;
  totalBattles: number;
  // JS Global leaderboard specific fields
  totalPoints?: number;
  solvedCount?: number;
  totalProblemsAttempted?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number | null;
  hasMore: boolean;
}