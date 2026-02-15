import { describe, it, expect } from "vitest";
import { generateSvgCard } from "../src/services/svg-generator";
import { CommitAnalysis } from "../src/types";

function mockAnalysis(): CommitAnalysis {
  return {
    username: "testuser",
    totalCommits: 1234,
    reposScanned: 15,
    dayDistribution: [
      { day: "Sunday", count: 50 },
      { day: "Monday", count: 200 },
      { day: "Tuesday", count: 180 },
      { day: "Wednesday", count: 190 },
      { day: "Thursday", count: 170 },
      { day: "Friday", count: 160 },
      { day: "Saturday", count: 80 },
    ],
    hourDistribution: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 100),
    })),
    mostActiveDay: "Monday",
    mostProductiveHour: 14,
    busiestDate: "2025-03-10",
    busiestDateCount: 25,
    streak: {
      longest: 42,
      longestStart: "2025-01-01",
      longestEnd: "2025-02-11",
      current: 7,
    },
    messageInsights: {
      shortest: "fix",
      longest: "refactor authentication to support OAuth2 flow",
      averageLength: 28,
      emojiCount: 15,
      topEmojis: ["\u2728", "\ud83d\udc1b", "\ud83c\udf89"],
    },
  };
}

describe("generateSvgCard", () => {
  it("generates valid SVG", () => {
    const svg = generateSvgCard(mockAnalysis());
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("includes username", () => {
    const svg = generateSvgCard(mockAnalysis());
    expect(svg).toContain("@testuser");
  });

  it("includes commit count", () => {
    const svg = generateSvgCard(mockAnalysis());
    // toLocaleString format varies by locale (1,234 or 1 234)
    expect(svg).toMatch(/1[,\s]234/);
  });

  it("includes streak info", () => {
    const svg = generateSvgCard(mockAnalysis());
    expect(svg).toContain("42d");
    expect(svg).toContain("7d");
  });

  it("includes interesting facts", () => {
    const svg = generateSvgCard(mockAnalysis());
    expect(svg).toContain("2025-03-10");
    expect(svg).toContain("Monday");
    expect(svg).toContain("fix");
  });

  it("generates dark theme", () => {
    const svg = generateSvgCard(mockAnalysis(), {
      theme: "dark",
      width: 495,
    });
    expect(svg).toContain("#0d1117");
  });

  it("generates light theme", () => {
    const svg = generateSvgCard(mockAnalysis(), {
      theme: "light",
      width: 495,
    });
    expect(svg).toContain("#ffffff");
  });

  it("sanitizes XSS in username", () => {
    const analysis = mockAnalysis();
    analysis.username = '<script>alert("xss")</script>';
    const svg = generateSvgCard(analysis);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("sanitizes XSS in commit messages", () => {
    const analysis = mockAnalysis();
    analysis.messageInsights.shortest = '<img onerror="alert(1)">';
    const svg = generateSvgCard(analysis);
    expect(svg).not.toContain('onerror="alert(1)"');
  });

  it("card size is under 50KB", () => {
    const svg = generateSvgCard(mockAnalysis());
    const sizeKB = Buffer.byteLength(svg, "utf8") / 1024;
    expect(sizeKB).toBeLessThan(50);
  });
});
