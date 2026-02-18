import { Router, Request, Response } from "express";
import {
  generateState,
  getAuthorizationUrl,
  exchangeCodeForToken,
  fetchAuthenticatedUser,
} from "../services/oauth";
import {
  storeToken,
  removeToken,
  hasToken,
  storeState,
  validateAndConsumeState,
} from "../utils/token-store";

const router = Router();

// Redirect user to GitHub OAuth
router.get("/github", (_req: Request, res: Response) => {
  try {
    const state = generateState();
    storeState(state).catch((err) =>
      console.error("[auth] Failed to store state:", err)
    );
    const url = getAuthorizationUrl(state);
    console.log(`[auth] Redirecting to GitHub OAuth`);
    res.redirect(url);
  } catch (err: any) {
    console.error(`[auth] Failed to start OAuth:`, err.message);
    res
      .status(500)
      .type("text/plain")
      .send(
        "OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
      );
  }
});

// OAuth callback from GitHub
router.get("/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  if (error) {
    console.log(`[auth] User denied OAuth: ${error}`);
    res.redirect("/?auth=denied");
    return;
  }

  if (!code || !state) {
    res.status(400).type("text/plain").send("Missing code or state parameter");
    return;
  }

  if (!(await validateAndConsumeState(state))) {
    res
      .status(403)
      .type("text/plain")
      .send("Invalid or expired state. Please try again.");
    return;
  }

  try {
    const { accessToken, scope } = await exchangeCodeForToken(code);
    const username = await fetchAuthenticatedUser(accessToken);

    await storeToken(username, {
      accessToken,
      scope,
      connectedAt: Date.now(),
    });

    console.log(`[auth] OAuth complete for "${username}" (scope: ${scope})`);
    res.redirect(`/?auth=success&user=${encodeURIComponent(username)}`);
  } catch (err: any) {
    console.error(`[auth] OAuth callback error:`, err.message);
    res.redirect("/?auth=error");
  }
});

// Check if a user has connected their account
router.get("/status/:username", async (req: Request, res: Response) => {
  const username = req.params.username as string;
  res.json({ connected: await hasToken(username) });
});

// Disconnect (remove stored token)
router.post("/logout/:username", async (req: Request, res: Response) => {
  const username = req.params.username as string;
  await removeToken(username);
  res.json({ disconnected: true });
});

export default router;
