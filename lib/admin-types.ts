import type { Difficulty, GameType, RewardStatus, RewardType, Role } from "./types";

export interface AdminStats {
  totals: {
    users: number;
    newUsersWeek: number;
    activeUsersWeek: number;
    clubs: number;
    games: number;
    quests: number;
    attempts: number;
    attemptsWeek: number;
    activeSeasons: number;
    rewardsIssued: number;
    rewardsRedeemed: number;
    courses: number;
  };
  activity: { day: string; signups: number; attempts: number }[];
  gameTypes: { type: GameType; count: number }[];
  rewardStatus: { status: RewardStatus; count: number }[];
  topClubs: { id: string; name: string; icon: string; color: string; members: number; attempts: number; games: number }[];
  topPlayers: { id: string; name: string; imageUrl: string | null; email: string; xp: number }[];
  recentAttempts: {
    id: string;
    user: { id: string; name: string; imageUrl: string | null };
    game: { title: string; type: GameType };
    club: { name: string; icon: string };
    accuracy: number;
    pointsEarned: number;
    createdAt: string;
  }[];
}

export interface AdminClub {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  coverImage: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { memberships: number; games: number; quests: number; seasons: number; attempts: number };
}

export interface AdminGameRow {
  id: string;
  title: string;
  type: GameType;
  difficulty: Difficulty;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  sortOrder: number;
  clubId: string;
  createdAt: string;
  club: { name: string; icon: string; color: string };
  _count: { attempts: number };
}

export interface AdminGame {
  id: string;
  clubId: string;
  title: string;
  description: string;
  type: GameType;
  difficulty: Difficulty;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  sortOrder: number;
  content: unknown;
}

export interface AdminQuest {
  id: string;
  clubId: string;
  title: string;
  description: string;
  bonusPoints: number;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  club: { name: string; icon: string; color: string };
  games: { gameId: string; game: { id: string; title: string; type: GameType } }[];
  _count: { completions: number };
}

export interface RewardTier {
  rankFrom: number;
  rankTo: number;
  type: RewardType;
  minDiscount: number;
  maxDiscount: number;
  validDays: number;
  label?: string | null;
}

export interface AdminSeason {
  id: string;
  clubId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  finalizedAt: string | null;
  club: { name: string; icon: string; color: string };
  tiers: (RewardTier & { id: string })[];
  _count: { rewards: number; attempts: number };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: Role;
  isBanned: boolean;
  createdAt: string;
  lastActiveAt: string;
  xp: number;
  level: number;
  _count: { attempts: number; memberships: number; rewards: number };
}

export interface AdminReward {
  id: string;
  type: RewardType;
  status: RewardStatus;
  discountPercent: number;
  code: string;
  rank: number | null;
  title: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; imageUrl: string | null };
  club: { name: string; icon: string } | null;
  season: { name: string } | null;
  course: { title: string } | null;
}
