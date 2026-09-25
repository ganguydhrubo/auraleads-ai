import { BrowserContext, Page } from "playwright";
import { pacedDelay } from "./pacing";

export interface ScrapedInstagramLead {
  username: string;
  postUrl: string;
}

export async function applyInstagramSession(context: BrowserContext, sessionId: string) {
  await context.addCookies([
    { name: "sessionid", value: sessionId, domain: ".instagram.com", path: "/", httpOnly: true, secure: true },
  ]);
}

// Instagram's hashtag page grid shows post thumbnails, not usernames — the
// author is only visible on the individual post page, so we open each one.
export async function searchInstagramHashtag(page: Page, hashtag: string, maxPosts = 8): Promise<ScrapedInstagramLead[]> {
  const clean = hashtag.replace(/^#/, "");
  await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(clean)}/`, { waitUntil: "domcontentloaded" });
  await pacedDelay();

  const postLinks = await page.$$eval('a[href*="/p/"]', (anchors) =>
    Array.from(new Set(anchors.map((a) => (a as HTMLAnchorElement).href))).slice(0, 20)
  );

  const results: ScrapedInstagramLead[] = [];

  for (const postUrl of postLinks.slice(0, maxPosts)) {
    try {
      await page.goto(postUrl, { waitUntil: "domcontentloaded" });
      await pacedDelay();

      const usernameEl = await page.$('header a[role="link"]');
      const username = usernameEl ? (await usernameEl.innerText()).trim() : "";
      if (username) results.push({ username, postUrl });
    } catch {
      continue;
    }
  }

  return results;
}

// Scrapes the follower list of a competitor's public Instagram account —
// this is what powers "Competitor Leads" (Instagram's API has no endpoint
// for a third party to list another account's followers at all).
export async function searchInstagramFollowers(page: Page, username: string, maxFollowers = 20): Promise<ScrapedInstagramLead[]> {
  const clean = username.replace(/^@/, "");
  await page.goto(`https://www.instagram.com/${encodeURIComponent(clean)}/`, { waitUntil: "domcontentloaded" });
  await pacedDelay();

  const followersLink = await page.locator(`a[href="/${clean}/followers/"]`).first();
  if (!(await followersLink.count())) throw new Error(`Could not find a followers link on @${clean}'s profile — it may be private or the page layout changed.`);
  await followersLink.click();
  await pacedDelay();

  const dialog = page.locator('div[role="dialog"]');
  if (!(await dialog.count())) throw new Error("Followers dialog did not open.");

  const results = new Map<string, ScrapedInstagramLead>();
  for (let i = 0; i < 6 && results.size < maxFollowers; i++) {
    const usernames = await dialog.locator('a[role="link"] > div > span').allInnerTexts().catch(() => [] as string[]);
    for (const u of usernames) {
      const handle = u.trim();
      if (handle && !results.has(handle)) results.set(handle, { username: handle, postUrl: `https://www.instagram.com/${handle}/` });
    }
    await dialog.locator('div[role="dialog"]').first().hover().catch(() => {});
    await page.mouse.wheel(0, 600);
    await pacedDelay();
  }

  return Array.from(results.values()).slice(0, maxFollowers);
}

export async function sendInstagramDirectMessage(page: Page, username: string, text: string): Promise<void> {
  await page.goto(`https://www.instagram.com/${encodeURIComponent(username)}/`, { waitUntil: "domcontentloaded" });
  await pacedDelay();

  const messageButton = await page.getByRole("button", { name: /message/i }).first();
  if (!(await messageButton.count())) throw new Error("Message button not found on this profile.");
  await messageButton.click();
  await pacedDelay();

  const composer = await page.locator('textarea[placeholder="Message..."], div[contenteditable="true"][aria-label*="Message"]').first();
  if (!(await composer.count())) throw new Error("Message composer not found.");
  await composer.click();
  await composer.type(text, { delay: 25 });
  await pacedDelay();

  await page.keyboard.press("Enter");
}
