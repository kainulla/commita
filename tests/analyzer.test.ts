import { describe, it, expect } from "vitest";
import { analyzeCommits } from "../src/services/analyzer";
import { GitHubCommit } from "../src/types";

function makeCommit(
  date: string,
  message: string = "test",
  repo: string = "repo"
): GitHubCommit {
  return { sha: Math.random().toString(36), message, date, repo };
}

describe("analyzeCommits", () => {
  it("returns correct totals", () => {
    const commits = [
      makeCommit("2025-03-10T10:00:00Z"),
      makeCommit("2025-03-11T14:00:00Z"),
      makeCommit("2025-03-12T09:00:00Z"),
    ];
    const result = analyzeCommits("testuser", commits, 2);
    expect(result.totalCommits).toBe(3);
    expect(result.reposScanned).toBe(2);
    expect(result.username).toBe("testuser");
  });

  it("detects most active day of week", () => {
    // Monday = 2025-03-10, Wednesday = 2025-03-12
    const commits = [
      makeCommit("2025-03-10T10:00:00Z"), // Monday
      makeCommit("2025-03-10T11:00:00Z"), // Monday
      makeCommit("2025-03-10T12:00:00Z"), // Monday
      makeCommit("2025-03-12T10:00:00Z"), // Wednesday
    ];
    const result = analyzeCommits("user", commits, 1);
    expect(result.mostActiveDay).toBe("Monday");
  });

  it("detects most productive hour", () => {
    const commits = [
      makeCommit("2025-03-10T14:00:00Z"),
      makeCommit("2025-03-11T14:30:00Z"),
      makeCommit("2025-03-12T14:15:00Z"),
      makeCommit("2025-03-10T09:00:00Z"),
    ];
    const result = analyzeCommits("user", commits, 1);
    expect(result.mostProductiveHour).toBe(14);
  });

  it("finds busiest date", () => {
    const commits = [
      makeCommit("2025-03-10T10:00:00Z"),
      makeCommit("2025-03-10T11:00:00Z"),
      makeCommit("2025-03-10T12:00:00Z"),
      makeCommit("2025-03-11T10:00:00Z"),
    ];
    const result = analyzeCommits("user", commits, 1);
    expect(result.busiestDate).toBe("2025-03-10");
    expect(result.busiestDateCount).toBe(3);
  });

  it("calculates longest streak", () => {
    const commits = [
      makeCommit("2025-03-10T10:00:00Z"),
      makeCommit("2025-03-11T10:00:00Z"),
      makeCommit("2025-03-12T10:00:00Z"),
      // gap
      makeCommit("2025-03-15T10:00:00Z"),
      makeCommit("2025-03-16T10:00:00Z"),
    ];
    const result = analyzeCommits("user", commits, 1);
    expect(result.streak.longest).toBe(3);
    expect(result.streak.longestStart).toBe("2025-03-10");
    expect(result.streak.longestEnd).toBe("2025-03-12");
  });

  it("handles empty commits", () => {
    const result = analyzeCommits("user", [], 0);
    expect(result.totalCommits).toBe(0);
    expect(result.streak.longest).toBe(0);
    expect(result.messageInsights.shortest).toBe("");
  });

  it("detects shortest and longest messages with dates", () => {
    const commits = [
      makeCommit("2025-03-10T10:00:00Z", "fix"),
      makeCommit("2025-03-11T10:00:00Z", "refactor authentication module to support OAuth2"),
      makeCommit("2025-03-12T10:00:00Z", "update readme"),
    ];
    const result = analyzeCommits("user", commits, 1);
    expect(result.messageInsights.shortest).toBe("fix");
    expect(result.messageInsights.shortestDate).toBe("2025-03-10");
    expect(result.messageInsights.longest).toBe(
      "refactor authentication module to support OAuth2"
    );
    expect(result.messageInsights.longestDate).toBe("2025-03-11");
  });

  it("counts emojis in messages", () => {
    const commits = [
      makeCommit("2025-03-10T10:00:00Z", "fix bug 🐛"),
      makeCommit("2025-03-11T10:00:00Z", "add feature ✨🎉"),
      makeCommit("2025-03-12T10:00:00Z", "docs update"),
    ];
    const result = analyzeCommits("user", commits, 1);
    expect(result.messageInsights.emojiCount).toBe(3);
    expect(result.messageInsights.topEmojis.length).toBeGreaterThan(0);
  });

  it("calculates day distribution across all 7 days", () => {
    const commits = [makeCommit("2025-03-10T10:00:00Z")];
    const result = analyzeCommits("user", commits, 1);
    expect(result.dayDistribution).toHaveLength(7);
    expect(result.dayDistribution.map((d) => d.day)).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
  });

  it("calculates hour distribution across all 24 hours", () => {
    const commits = [makeCommit("2025-03-10T10:00:00Z")];
    const result = analyzeCommits("user", commits, 1);
    expect(result.hourDistribution).toHaveLength(24);
  });
});
