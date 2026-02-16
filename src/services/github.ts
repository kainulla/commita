import { GitHubRepo, GitHubCommit } from "../types";

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;

// Public: 60 req/hour primary limit — stay conservative
// Auth: 5000 req/hour primary, 900 req/min secondary limit
const LIMITS = {
  auth: { maxRepos: 200, maxCommitsPerRepo: 500 },
  public: { maxRepos: 50, maxCommitsPerRepo: 200 },
};
// With batch size 5 and 500ms delay: ~10 req/sec = ~600 req/min (under 900 limit)
const BATCH_DELAY_MS = 500;

function buildHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Commita/1.0",
  };
  const authToken = token || process.env.GITHUB_TOKEN;
  if (authToken) {
    h["Authorization"] = `Bearer ${authToken}`;
  }
  return h;
}

async function githubFetch<T>(url: string, token?: string): Promise<T> {
  console.log(`[github] GET ${url.replace(GITHUB_API, "")}`);
  const res = await fetch(url, { headers: buildHeaders(token) });
  const remaining = res.headers.get("x-ratelimit-remaining");
  const limit = res.headers.get("x-ratelimit-limit");
  if (remaining) {
    console.log(`[github] ${res.status} | rate limit: ${remaining}/${limit}`);
  }

  if (res.status === 404) {
    throw new Error("GitHub user not found");
  }
  if (res.status === 403) {
    const rateLimitRemaining = res.headers.get("x-ratelimit-remaining");
    if (rateLimitRemaining === "0") {
      const resetAt = res.headers.get("x-ratelimit-reset");
      const resetDate = resetAt
        ? new Date(parseInt(resetAt) * 1000).toISOString()
        : "unknown";
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate}`);
    }
    throw new Error("GitHub API access forbidden");
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchUserRepos(
  username: string,
  token?: string
): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const maxRepos = token ? LIMITS.auth.maxRepos : LIMITS.public.maxRepos;

  // With a user token, use /user/repos to include private repos
  const useAuthenticatedEndpoint = !!token;

  while (allRepos.length < maxRepos) {
    let url: string;
    if (useAuthenticatedEndpoint) {
      // Authenticated: fetch all repos the user owns (public + private)
      url = `${GITHUB_API}/user/repos?per_page=${PER_PAGE}&page=${page}&sort=pushed&affiliation=owner`;
    } else {
      // Unauthenticated: public repos only
      url = `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=${PER_PAGE}&page=${page}&sort=pushed&type=owner`;
    }

    const repos = await githubFetch<any[]>(url, token);

    if (repos.length === 0) break;

    for (const repo of repos) {
      if (allRepos.length >= maxRepos) break;
      if (repo.fork) continue;
      allRepos.push({
        name: repo.name,
        full_name: repo.full_name,
        fork: repo.fork,
        default_branch: repo.default_branch,
      });
    }

    if (repos.length < PER_PAGE) break;
    page++;
  }

  return allRepos;
}

export async function fetchRepoCommits(
  owner: string,
  repo: string,
  author: string,
  token?: string
): Promise<GitHubCommit[]> {
  const commits: GitHubCommit[] = [];
  let page = 1;
  const maxCommits = token ? LIMITS.auth.maxCommitsPerRepo : LIMITS.public.maxCommitsPerRepo;

  while (commits.length < maxCommits) {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?author=${encodeURIComponent(author)}&per_page=${PER_PAGE}&page=${page}`;

    let batch: any[];
    try {
      batch = await githubFetch<any[]>(url, token);
    } catch (err: any) {
      // Some repos may have empty history or restricted access
      if (err.message?.includes("409") || err.message?.includes("Git Repository is empty")) {
        break;
      }
      throw err;
    }

    if (batch.length === 0) break;

    for (const item of batch) {
      if (commits.length >= maxCommits) break;
      const commitData = item.commit;
      if (!commitData?.author?.date) continue;

      commits.push({
        sha: item.sha,
        message: commitData.message?.split("\n")[0] || "",
        date: commitData.author.date,
        repo: repo,
      });
    }

    if (batch.length < PER_PAGE) break;
    page++;
  }

  return commits;
}

export async function fetchAllCommits(
  username: string,
  token?: string
): Promise<{ commits: GitHubCommit[]; reposScanned: number }> {
  const mode = token ? "authenticated (private+public)" : "public only";
  console.log(`[github] Fetching repos for "${username}" [${mode}]...`);
  const repos = await fetchUserRepos(username, token);
  console.log(`[github] Found ${repos.length} repos (excluding forks)`);
  const allCommits: GitHubCommit[] = [];

  // Fetch commits from all repos concurrently (batched to avoid overwhelming the API)
  const BATCH_SIZE = 5;
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE);
    console.log(`[github] Fetching commits batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(repos.length / BATCH_SIZE)}: ${batch.map(r => r.name).join(", ")}`);
    const results = await Promise.allSettled(
      batch.map((repo) =>
        fetchRepoCommits(username, repo.name, username, token)
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allCommits.push(...result.value);
      } else {
        console.warn(`[github] Failed to fetch commits:`, result.reason?.message);
      }
    }

    // Throttle between batches to stay under 900 req/min secondary limit
    if (i + BATCH_SIZE < repos.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(`[github] Total: ${allCommits.length} commits from ${repos.length} repos`);
  return { commits: allCommits, reposScanned: repos.length };
}
