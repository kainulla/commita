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
  const barHeight = 12;
  const gap = 5;
  const labelWidth = 32;
  const countWidth = 30;
  const maxBarWidth = width - labelWidth - countWidth - 10;

  return analysis.dayDistribution
    .map((d, i) => {
      const barWidth = Math.max((d.count / maxCount) * maxBarWidth, 2);
      const yPos = y + i * (barHeight + gap);
      const isMax = d.day === analysis.mostActiveDay;
      return `
      <text x="${x}" y="${yPos + 10}" fill="${isMax ? theme.accent : theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="${isMax ? "600" : "400"}">${d.day.slice(0, 3)}</text>
      <rect x="${x + labelWidth}" y="${yPos}" width="${barWidth}" height="${barHeight}" rx="3" fill="${isMax ? theme.barFill : theme.barBg}" opacity="${isMax ? 1 : 0.6}"/>
      <text x="${x + labelWidth + barWidth + 5}" y="${yPos + 10}" fill="${theme.muted}" font-size="10" font-family="'Segoe UI', Ubuntu, sans-serif">${d.count}</text>`;
    })
    .join("");
}

function generateHourChart(
  analysis: CommitAnalysis,
  theme: typeof THEMES.light,
  x: number,
  y: number,
  width: number,
  chartHeight: number
): string {
  const maxCount = Math.max(
    ...analysis.hourDistribution.map((h) => h.count),
    1
  );
  const totalGap = 23; // 1px gap between each of the 24 bars
  const barWidth = Math.floor((width - totalGap) / 24);
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
    return `<text x="${xPos}" y="${y + chartHeight + 14}" fill="${theme.muted}" font-size="9" font-family="'Segoe UI', Ubuntu, sans-serif">${formatHour(h)}</text>`;
  }).join("");

  return bars + labels;
}

function generateStatsRow(
  analysis: CommitAnalysis,
  theme: typeof THEMES.light,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number
): string {
  const stats = [
    { value: analysis.totalCommits.toLocaleString(), label: "Commits", color: theme.accent },
    { value: String(analysis.reposScanned), label: "Repos", color: theme.accent },
    { value: `${analysis.streak.longest}d`, label: "Best Streak", color: theme.streakColor },
    { value: `${analysis.streak.current}d`, label: "Current Streak", color: theme.streakColor },
  ];

  const colWidth = boxWidth / stats.length;

  const statElements = stats
    .map((s, i) => {
      const cx = boxX + colWidth * i + colWidth / 2;
      return `
    <text x="${cx}" y="${boxY + 22}" fill="${s.color}" font-size="18" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif" text-anchor="middle">${s.value}</text>
    <text x="${cx}" y="${boxY + 40}" fill="${theme.muted}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif" text-anchor="middle">${s.label}</text>`;
    })
    .join("");

  return `
  <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" rx="5" fill="${theme.cardBg}" stroke="${theme.sectionBorder}" stroke-width="0.5"/>
  ${statElements}`;
}

export function generateSvgCard(
  analysis: CommitAnalysis,
  options: CardOptions = { theme: "light", width: 495 }
): string {
  const theme = THEMES[options.theme];
  const { width } = options;
  const pad = 20;
  const username = sanitizeSvgText(analysis.username);
  const shortestMsg = sanitizeSvgText(
    truncate(analysis.messageInsights.shortest, 40)
  );
  const longestMsg = sanitizeSvgText(
    truncate(analysis.messageInsights.longest, 40)
  );

  // Layout Y positions
  const titleY = 30;
  const statsY = 48;
  const statsH = 52;
  const sectionHeaderY = statsY + statsH + 22;
  const chartsY = sectionHeaderY + 14;

  // Day bars: 7 items × (12h + 5gap) - 5 = 114
  const dayBarsHeight = 7 * (12 + 5) - 5;
  const halfWidth = (width - pad * 2 - 20) / 2; // 20px gap between halves

  // Hour chart matches day bars height
  const hourChartHeight = dayBarsHeight - 16; // leave room for labels

  const dividerY = chartsY + dayBarsHeight + 16;

  // Fun Facts
  const factsHeaderY = dividerY + 20;
  const factsStartY = factsHeaderY + 18;
  const lineSpacing = 18;
  let factsLine = 0;

  const busiestLine = `<text x="${pad}" y="${factsStartY + lineSpacing * factsLine}" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif"><tspan font-weight="500" fill="${theme.accent}">Busiest day:</tspan> ${sanitizeSvgText(analysis.busiestDate)} (${analysis.busiestDateCount} commits)</text>`;
  factsLine++;

  const peakLine = `<text x="${pad}" y="${factsStartY + lineSpacing * factsLine}" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif"><tspan font-weight="500" fill="${theme.accent}">Peak hour:</tspan> ${formatHour(analysis.mostProductiveHour)} UTC &#183; <tspan font-weight="500" fill="${theme.accent}">Fav day:</tspan> ${analysis.mostActiveDay}</text>`;
  factsLine++;

  const shortLine = `<text x="${pad}" y="${factsStartY + lineSpacing * factsLine}" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif"><tspan font-weight="500" fill="${theme.accent}">Shortest msg:</tspan> &quot;${shortestMsg}&quot;</text>`;
  factsLine++;

  const longLine = `<text x="${pad}" y="${factsStartY + lineSpacing * factsLine}" fill="${theme.text}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif"><tspan font-weight="500" fill="${theme.accent}">Longest msg:</tspan> &quot;${longestMsg}&quot;</text>`;
  factsLine++;

  let emojiLine = "";
  if (analysis.messageInsights.topEmojis.length > 0) {
    emojiLine = `<text x="${pad}" y="${factsStartY + lineSpacing * factsLine}" fill="${theme.muted}" font-size="11" font-family="'Segoe UI', Ubuntu, sans-serif">Top emojis: ${analysis.messageInsights.topEmojis.join(" ")} (${analysis.messageInsights.emojiCount} total)</text>`;
    factsLine++;
  }

  // Compute total height dynamically
  const height = factsStartY + lineSpacing * factsLine + 20;

  const dayBars = generateDayBars(analysis, theme, pad, chartsY, halfWidth);
  const rightX = pad + halfWidth + 20;
  const hourChart = generateHourChart(
    analysis,
    theme,
    rightX,
    chartsY,
    halfWidth,
    hourChartHeight
  );

  const statsRow = generateStatsRow(
    analysis,
    theme,
    pad - 5,
    statsY,
    width - (pad - 5) * 2,
    statsH
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <rect width="${width}" height="${height}" rx="6" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>

  <!-- Title -->
  <text x="${pad}" y="${titleY}" fill="${theme.title}" font-size="16" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">Commita</text>
  <text x="${pad + 68}" y="${titleY}" fill="${theme.muted}" font-size="14" font-family="'Segoe UI', Ubuntu, sans-serif">@${username}</text>

  <!-- Stats Row -->
  ${statsRow}

  <!-- Section: Day Distribution -->
  <text x="${pad}" y="${sectionHeaderY}" fill="${theme.title}" font-size="12" font-weight="600" font-family="'Segoe UI', Ubuntu, sans-serif">Most Active Days</text>
  ${dayBars}

  <!-- Section: Hour Distribution -->
  <text x="${rightX}" y="${sectionHeaderY}" fill="${theme.title}" font-size="12" font-weight="600" font-family="'Segoe UI', Ubuntu, sans-serif">Commits by Hour (UTC)</text>
  ${hourChart}

  <!-- Divider -->
  <line x1="${pad}" y1="${dividerY}" x2="${width - pad}" y2="${dividerY}" stroke="${theme.border}" stroke-width="0.5"/>

  <!-- Fun Facts -->
  <text x="${pad}" y="${factsHeaderY}" fill="${theme.title}" font-size="12" font-weight="600" font-family="'Segoe UI', Ubuntu, sans-serif">Fun Facts</text>
  ${busiestLine}
  ${peakLine}
  ${shortLine}
  ${longLine}
  ${emojiLine}

  <!-- Footer -->
  <text x="${width - pad}" y="${height - 10}" fill="${theme.muted}" font-size="9" font-family="'Segoe UI', Ubuntu, sans-serif" text-anchor="end">commita.dev</text>
</svg>`;
}
