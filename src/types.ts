export interface GitHubRepo {
  name: string;
  full_name: string;
  fork: boolean;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  date: string; // ISO 8601
  repo: string;
}

export interface DayDistribution {
  day: string;
  count: number;
}

export interface HourDistribution {
  hour: number;
  count: number;
}

export interface StreakInfo {
  longest: number;
  longestStart: string | null;
  longestEnd: string | null;
  current: number;
}

export interface MessageInsights {
  shortest: string;
  shortestDate: string;
  longest: string;
  longestDate: string;
  averageLength: number;
  emojiCount: number;
  topEmojis: string[];
}

export interface CommitAnalysis {
  username: string;
  totalCommits: number;
  reposScanned: number;
  dayDistribution: DayDistribution[];
  hourDistribution: HourDistribution[];
  mostActiveDay: string;
  mostProductiveHour: number;
  busiestDate: string;
  busiestDateCount: number;
  streak: StreakInfo;
  messageInsights: MessageInsights;
}

export interface CardOptions {
  theme: "light" | "dark";
  width: number;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface OAuthTokenEntry {
  accessToken: string;
  scope: string;
  connectedAt: number;
}

export interface OAuthState {
  state: string;
  createdAt: number;
}
