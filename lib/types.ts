export type Role = "USER" | "ADMIN";
export type GameType = "QUIZ" | "TRUE_FALSE" | "MEMORY_MATCH" | "WORD_SCRAMBLE" | "SEQUENCE" | "FILL_BLANK";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type RewardType = "SCRATCH_CARD" | "PASS";
export type RewardStatus = "UNSCRATCHED" | "AVAILABLE" | "REDEEMED" | "EXPIRED" | "REVOKED";

export interface LevelInfo {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
}

export interface Me {
  user: { id: string; email: string; name: string | null; imageUrl: string | null; role: Role; createdAt: string };
  stats: {
    level: LevelInfo;
    gamesPlayed: number;
    questsCompleted: number;
    clubsJoined: number;
    rewardsAvailable: number;
    unscratched: number;
  };
}

export interface SeasonLite {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  finalizedAt: string | null;
}

export interface ClubSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  coverImage: string | null;
  memberCount: number;
  gameCount: number;
  isMember: boolean;
  activeSeason: SeasonLite | null;
}

export interface GameSummary {
  id: string;
  title: string;
  description: string;
  type: GameType;
  difficulty: Difficulty;
  points: number;
  timeLimit: number | null;
  plays: number;
  myBest: { pointsEarned: number; accuracy: number } | null;
}

export interface QuestView {
  id: string;
  title: string;
  description: string;
  bonusPoints: number;
  startsAt: string;
  endsAt: string | null;
  completed: boolean;
  games: { id: string; title: string; type: GameType; passed: boolean }[];
  club?: { name: string; slug: string; icon: string; color: string };
}

export interface ClubDetail extends ClubSummary {
  myStanding: { rank: number | null; points: number; totalPlayers: number } | null;
  games: GameSummary[];
  quests: QuestView[];
}

export interface PublicUser {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  points: number;
  user: PublicUser;
}

export interface Leaderboard {
  scope: "season" | "all";
  season: SeasonLite | null;
  total: number;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export interface Dashboard {
  clubs: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    activeSeason: SeasonLite | null;
    myRank: number | null;
    myPoints: number;
    totalPlayers: number;
  }[];
  quests: QuestView[];
  recent: {
    id: string;
    gameId: string;
    gameTitle: string;
    gameType: GameType;
    clubName: string;
    clubSlug: string;
    accuracy: number;
    pointsEarned: number;
    createdAt: string;
  }[];
  unscratched: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  _count?: { redemptions: number };
}

export interface Reward {
  id: string;
  type: RewardType;
  status: RewardStatus;
  discountPercent: number | null;
  code: string | null;
  rank: number | null;
  title: string;
  note: string | null;
  expiresAt: string | null;
  revealedAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
  club: { name: string; slug: string; icon: string; color: string } | null;
  season: { name: string } | null;
  course: { id: string; title: string; price: number } | null;
}

export interface ReviewItem {
  label: string;
  given: string | null;
  answer: string;
  correct: boolean;
  explanation?: string;
}

export interface AttemptResult {
  attemptId: string;
  score: number;
  maxScore: number;
  accuracy: number;
  passed: boolean;
  pointsEarned: number;
  basePoints: number;
  speedBonus: number;
  leaderboardPoints: number;
  previousBest: number;
  isNewBest: boolean;
  timeTaken: number;
  completedQuests: { id: string; title: string; bonusPoints: number }[];
  season: { id: string; name: string } | null;
  review: ReviewItem[];
}

// ----- Game payloads -----
export interface QuizPayload {
  questions: { prompt: string; options: string[] }[];
}
export interface TrueFalsePayload {
  statements: { text: string }[];
}
export interface MemoryPayload {
  pairCount: number;
  cards: { id: number; pairId: number; text: string }[];
}
export interface ScramblePayload {
  words: { scrambled: string; length: number; hint: string }[];
}
export interface SequencePayload {
  rounds: { prompt: string; items: { id: number; text: string }[] }[];
}
export interface FillBlankPayload {
  sentences: { text: string; hint: string | null }[];
}

export interface GameRun {
  game: {
    id: string;
    title: string;
    description: string;
    type: GameType;
    difficulty: Difficulty;
    points: number;
    timeLimit: number | null;
  };
  club: { id: string; name: string; slug: string; icon: string; color: string };
  isMember: boolean;
  payload: unknown;
  plays: number;
  myBest: { pointsEarned: number; accuracy: number } | null;
}

export interface GameProps<P, A> {
  payload: P;
  color: string;
  onChange: (answers: A) => void;
  onFinish: (answers: A) => void;
}
