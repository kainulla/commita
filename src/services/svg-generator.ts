import { CommitAnalysis, CardOptions } from "../types";
import { sanitizeSvgText, truncate } from "../utils/sanitize";

const THEMES = {
  light: {
    bg: "#ffffff",
    cardBg: "#f6f8fa",
    border: "#d0d7de",
    title: "#24292f",
    text: "#57606a",
    accent: "#0969da",
    muted: "#8b949e",
    barBg: "#e1e4e8",
    barFill: "#0969da",
    sectionBg: "#ffffff",
    sectionBorder: "#d0d7de",
    streakColor: "#1a7f37",
    emojiAccent: "#cf222e",
  },
  dark: {
    bg: "#0d1117",
    cardBg: "#161b22",
    border: "#30363d",
    title: "#f0f6fc",
    text: "#c9d1d9",
    accent: "#58a6ff",
    muted: "#8b949e",
    barBg: "#21262d",
    barFill: "#58a6ff",
    sectionBg: "#0d1117",
    sectionBorder: "#30363d",
    streakColor: "#3fb950",
    emojiAccent: "#f85149",
  },
};

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function generateDayBars(
  analysis: CommitAnalysis,
  theme: typeof THEMES.light,
  x: number,
  y: number,
  width: number
): string {
  const maxCount = Math.max(...analysis.dayDistribution.map((d) => d.count), 1);
  const barHeight = 14;
  const gap = 6;

  return analysis.dayDistribution
    .map((d, i) => {
      const barWidth = Math.max((d.count / maxCount) * (width - 80), 2);
      const yPos = y + i * (barHeight + gap);
      const isMax = d.day === analysis.mostActiveDay;
      return `
      <text x="${x}" y="${yPos + 11}" fill="${isMax ? theme.accent : theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="${isMax ? "600" : "400"}">${d.day.slice(0, 3)}</text>
      <rect x="${x + 40}" y="${yPos}" width="${barWidth}" height="${barHeight}" rx="3" fill="${isMax ? theme.barFill : theme.barBg}" opacity="${isMax ? 1 : 0.6}"/>
      <text x="${x + 45 + barWidth}" y="${yPos + 11}" fill="${theme.muted}" font-size="10" font-family="'Segoe UI', Ubuntu, sans-serif">${d.count}</text>`;
    })
    .join("");
}

function generateHourChart(
  analysis: CommitAnalysis,
  theme: typeof THEMES.light,
  x: number,
  y: number,
  width: number
): string {
  const maxCount = Math.max(
    ...analysis.hourDistribution.map((h) => h.count),
    1
  );
  const chartHeight = 50;
  const barWidth = Math.floor((width - 10) / 24);
  const gap = 1;

  const bars = analysis.hourDistribution
    .map((h, i) => {
      const barH = Math.max((h.count / maxCount) * chartHeight, 1);
      const xPos = x + i * (barWidth + gap);
      const yPos = y + chartHeight - barH;
      const isMax = h.hour === analysis.mostProductiveHour;
      return `<rect x="${xPos}" y="${yPos}" width="${barWidth}" height="${barH}" rx="1" fill="${isMax ? theme.accent : theme.barFill}" opacity="${isMax ? 1 : 0.3}"/>`;
    })
    .join("");

  const labels = [0, 6, 12, 18].map((h) => {
    const xPos = x + h * (barWidth + gap);
    return `<text x="${xPos}" y="${y + chartHeight + 12}" fill="${theme.muted}" font-size="9" font-family="'Segoe UI', Ubuntu, sans-serif">${formatHour(h)}</text>`;
  }).join("");

  return bars + labels;
}

export function generateSvgCard(
  analysis: CommitAnalysis,
  options: CardOptions = { theme: "light", width: 495, height: 440 }
): string {
  const theme = THEMES[options.theme];
  const { width, height } = options;
  const username = sanitizeSvgText(analysis.username);
  const shortestMsg = sanitizeSvgText(
    truncate(analysis.messageInsights.shortest, 40)
  );
  const longestMsg = sanitizeSvgText(
    truncate(analysis.messageInsights.longest, 40)
  );

  const dayBars = generateDayBars(analysis, theme, 25, 140, width / 2 - 40);
  const hourChart = generateHourChart(
    analysis,
    theme,
    width / 2 + 15,
    140,
    width / 2 - 40
  );

  const emojiSection =
    analysis.messageInsights.topEmojis.length > 0
      ? `<text x="25" y="410" fill="${theme.muted}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">Top emojis: ${analysis.messageInsights.topEmojis.join(" ")} (${analysis.messageInsights.emojiCount} total)</text>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <rect width="${width}" height="${height}" rx="6" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>

  <!-- Title -->
  <text x="25" y="35" fill="${theme.title}" font-size="16" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">Commita</text>
  <text x="90" y="35" fill="${theme.muted}" font-size="14" font-family="'Segoe UI', Ubuntu, sans-serif">@${username}</text>

  <!-- Stats Row -->
  <rect x="15" y="50" width="${width - 30}" height="60" rx="5" fill="${theme.cardBg}" stroke="${theme.sectionBorder}" stroke-width="0.5"/>

  <text x="40" y="72" fill="${theme.accent}" font-size="18" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">${analysis.totalCommits.toLocaleString()}</text>
  <text x="40" y="97" fill="${theme.muted}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">Commits</text>

  <text x="${width * 0.28}" y="72" fill="${theme.accent}" font-size="18" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">${analysis.reposScanned}</text>
  <text x="${width * 0.28}" y="97" fill="${theme.muted}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">Repos</text>

  <text x="${width * 0.5}" y="72" fill="${theme.streakColor}" font-size="18" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">${analysis.streak.longest}d</text>
  <text x="${width * 0.5}" y="97" fill="${theme.muted}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">Best Streak</text>

  <text x="${width * 0.73}" y="72" fill="${theme.streakColor}" font-size="18" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">${analysis.streak.current}d</text>
  <text x="${width * 0.73}" y="97" fill="${theme.muted}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">Current Streak</text>

  <!-- Section: Day Distribution -->
  <text x="25" y="130" fill="${theme.title}" font-size="12" font-weight="600" font-family="'Segoe UI', Ubuntu, sans-serif">Most Active Days</text>
  ${dayBars}

  <!-- Section: Hour Distribution -->
  <text x="${width / 2 + 15}" y="130" fill="${theme.title}" font-size="12" font-weight="600" font-family="'Segoe UI', Ubuntu, sans-serif">Commits by Hour (UTC)</text>
  ${hourChart}

  <!-- Divider -->
  <line x1="25" y1="290" x2="${width - 25}" y2="290" stroke="${theme.border}" stroke-width="0.5"/>

  <!-- Fun Facts -->
  <text x="25" y="315" fill="${theme.title}" font-size="12" font-weight="600" font-family="'Segoe UI', Ubuntu, sans-serif">Fun Facts</text>

  <text x="25" y="340" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">
    <tspan font-weight="500" fill="${theme.accent}">Busiest day:</tspan> ${sanitizeSvgText(analysis.busiestDate)} (${analysis.busiestDateCount} commits)
  </text>
  <text x="25" y="360" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">
    <tspan font-weight="500" fill="${theme.accent}">Peak hour:</tspan> ${formatHour(analysis.mostProductiveHour)} UTC &middot; <tspan font-weight="500" fill="${theme.accent}">Fav day:</tspan> ${analysis.mostActiveDay}
  </text>
  <text x="25" y="380" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">
    <tspan font-weight="500" fill="${theme.accent}">Shortest msg:</tspan> &quot;${shortestMsg}&quot;
  </text>
  <text x="25" y="400" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">
    <tspan font-weight="500" fill="${theme.accent}">Longest msg:</tspan> &quot;${longestMsg}&quot;
  </text>
  ${emojiSection}

  <!-- Footer -->
  <text x="${width - 20}" y="${height - 10}" fill="${theme.muted}" font-size="9" font-family="'Segoe UI', Ubuntu, sans-serif" text-anchor="end">commita.dev</text>
</svg>`;
}
