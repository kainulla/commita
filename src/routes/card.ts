import { Router, Request, Response } from "express";
import { fetchAllCommits } from "../services/github";
import { analyzeCommits } from "../services/analyzer";
import { generateSvgCard } from "../services/svg-generator";
import { Cache } from "../utils/cache";
import { getToken } from "../utils/token-store";
import { CommitAnalysis, CardOptions } from "../types";

const cache = new Cache<CommitAnalysis>(
  parseInt(process.env.CACHE_TTL || "3600", 10)
);

// Separate cache keys for public vs authenticated to avoid mixing data
function cacheKey(username: string, authenticated: boolean): string {
  return `${username.toLowerCase()}:${authenticated ? "auth" : "pub"}`;
}

const router = Router();

router.get("/:username", async (req: Request, res: Response) => {
  const username = req.params.username as string;
  const theme = req.query.theme === "dark" ? "dark" : "light";

  if (!username || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
    res.status(400).type("text/plain").send("Invalid GitHub username");
    return;
  }

  // ?public=1 means the user explicitly wants public-only data (ignore stored token)
  const forcePublic = req.query.public === "1";

  try {
    const userToken = forcePublic ? null : await getToken(username);
    const isAuthenticated = !!userToken;
    const key = cacheKey(username, isAuthenticated);

    let analysis = cache.get(key);

    if (analysis) {
      console.log(`[card] Cache hit for "${username}" (${isAuthenticated ? "auth" : "public"})`);
    } else {
      console.log(`[card] Cache miss for "${username}", fetching from GitHub (${isAuthenticated ? "auth" : "public"})...`);
      const { commits, reposScanned } = await fetchAllCommits(
        username,
        userToken || undefined
      );
      console.log(`[card] Fetched ${commits.length} commits from ${reposScanned} repos`);

      if (commits.length === 0) {
        res
          .status(404)
          .type("text/plain")
          .send("No commits found for this user");
        return;
      }

      analysis = analyzeCommits(username, commits, reposScanned);
      cache.set(key, analysis);
    }

    const options: CardOptions = { theme, width: 495 };
    const svg = generateSvgCard(analysis, options);
    console.log(`[card] Generated SVG for "${username}" (${svg.length} bytes)`);

    res
      .status(200)
      .set({
        "Content-Type": "image/svg+xml",
        "Cache-Control": isAuthenticated
          ? "private, no-cache"
          : "public, max-age=3600",
      })
      .send(svg);
  } catch (err: any) {
    const message = err.message || "Internal server error";
    console.error(`[card] Error for "${username}":`, message);

    if (message.includes("not found")) {
      res.status(404).type("text/plain").send("GitHub user not found");
      return;
    }
    if (message.includes("rate limit")) {
      res.status(429).type("text/plain").send(message);
      return;
    }

    res.status(500).type("text/plain").send("Failed to generate card: " + message);
  }
});

// JSON API endpoint for raw analysis data
router.get("/:username/json", async (req: Request, res: Response) => {
  const username = req.params.username as string;

  if (!username || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
    res.status(400).json({ error: "Invalid GitHub username" });
    return;
  }

  const forcePublicJson = req.query.public === "1";

  try {
    const userToken = forcePublicJson ? null : await getToken(username);
    const key = cacheKey(username, !!userToken);
    let analysis = cache.get(key);

    if (!analysis) {
      const { commits, reposScanned } = await fetchAllCommits(
        username,
        userToken || undefined
      );

      if (commits.length === 0) {
        res.status(404).json({ error: "No commits found" });
        return;
      }

      analysis = analyzeCommits(username, commits, reposScanned);
      cache.set(key, analysis);
    }

    res.status(200).json(analysis);
  } catch (err: any) {
    const message = err.message || "Internal server error";

    if (message.includes("not found")) {
      res.status(404).json({ error: "GitHub user not found" });
      return;
    }
    if (message.includes("rate limit")) {
      res.status(429).json({ error: message });
      return;
    }

    console.error(`Error generating data for ${username}:`, err);
    res.status(500).json({ error: "Failed to generate analysis" });
  }
});

export default router;
