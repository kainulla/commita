import {
  GitHubCommit,
  CommitAnalysis,
  DayDistribution,
  HourDistribution,
  StreakInfo,
  MessageInsights,
} from "../types";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EMOJI_REGEX = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

function analyzeDayDistribution(commits: GitHubCommit[]): DayDistribution[] {
  const counts = new Array(7).fill(0);
  for (const commit of commits) {
    const day = new Date(commit.date).getUTCDay();
    counts[day]++;
  }
  return DAYS.map((day, i) => ({ day, count: counts[i] }));
}

function analyzeHourDistribution(commits: GitHubCommit[]): HourDistribution[] {
  const counts = new Array(24).fill(0);
  for (const commit of commits) {
    const hour = new Date(commit.date).getUTCHours();
    counts[hour]++;
  }
  return counts.map((count, hour) => ({ hour, count }));
}

function findBusiestDate(
  commits: GitHubCommit[]
): { date: string; count: number } {
  const dateCounts = new Map<string, number>();
  for (const commit of commits) {
    const date = commit.date.slice(0, 10); // YYYY-MM-DD
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
  }

  let maxDate = "";
  let maxCount = 0;
  for (const [date, count] of dateCounts) {
    if (count > maxCount) {
      maxDate = date;
      maxCount = count;
    }
  }
  return { date: maxDate, count: maxCount };
}

function analyzeStreaks(commits: GitHubCommit[]): StreakInfo {
  if (commits.length === 0) {
    return { longest: 0, longestStart: null, longestEnd: null, current: 0 };
  }

  // Get unique dates sorted ascending
  const dates = [
    ...new Set(commits.map((c) => c.date.slice(0, 10))),
  ].sort();

  let longest = 1;
  let longestStart = dates[0];
  let longestEnd = dates[0];
  let currentStreak = 1;
  let currentStart = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
    } else {
      if (currentStreak > longest) {
        longest = currentStreak;
        longestStart = currentStart;
        longestEnd = dates[i - 1];
      }
      currentStreak = 1;
      currentStart = dates[i];
    }
  }

  // Check final streak
  if (currentStreak > longest) {
    longest = currentStreak;
    longestStart = currentStart;
    longestEnd = dates[dates.length - 1];
  }

  // Calculate current streak (from today backwards)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let current = 0;

  if (dates.includes(today) || dates.includes(yesterday)) {
    const startDate = dates.includes(today) ? today : yesterday;
    const startIdx = dates.indexOf(startDate);
    current = 1;
    for (let i = startIdx - 1; i >= 0; i--) {
      const prev = new Date(dates[i]);
      const curr = new Date(dates[i + 1]);
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { longest, longestStart, longestEnd, current };
}

function analyzeMessages(commits: GitHubCommit[]): MessageInsights {
  if (commits.length === 0) {
    return {
      shortest: "",
      longest: "",
      averageLength: 0,
      emojiCount: 0,
      topEmojis: [],
    };
  }

  const messages = commits.map((c) => c.message);
  let shortest = messages[0];
  let longest = messages[0];
  let totalLength = 0;
  const emojiCounts = new Map<string, number>();

  for (const msg of messages) {
    totalLength += msg.length;
    if (msg.length < shortest.length) shortest = msg;
    if (msg.length > longest.length) longest = msg;

    const emojis = msg.match(EMOJI_REGEX);
    if (emojis) {
      for (const emoji of emojis) {
        emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1);
      }
    }
  }

  const topEmojis = [...emojiCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emoji]) => emoji);

  let totalEmojiCount = 0;
  for (const count of emojiCounts.values()) {
    totalEmojiCount += count;
  }

  return {
    shortest,
    longest,
    averageLength: Math.round(totalLength / messages.length),
    emojiCount: totalEmojiCount,
    topEmojis,
  };
}

export function analyzeCommits(
  username: string,
  commits: GitHubCommit[],
  reposScanned: number
): CommitAnalysis {
  const dayDist = analyzeDayDistribution(commits);
  const hourDist = analyzeHourDistribution(commits);
  const busiest = findBusiestDate(commits);

  const mostActiveDay =
    dayDist.reduce((max, d) => (d.count > max.count ? d : max), dayDist[0])
      ?.day || "N/A";

  const mostProductiveHour =
    hourDist.reduce((max, h) => (h.count > max.count ? h : max), hourDist[0])
      ?.hour ?? 0;

  return {
    username,
    totalCommits: commits.length,
    reposScanned,
    dayDistribution: dayDist,
    hourDistribution: hourDist,
    mostActiveDay,
    mostProductiveHour,
    busiestDate: busiest.date,
    busiestDateCount: busiest.count,
    streak: analyzeStreaks(commits),
    messageInsights: analyzeMessages(commits),
  };
}
