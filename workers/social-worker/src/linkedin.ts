import { BrowserContext, Page } from "playwright";
import { pacedDelay } from "./pacing";

export interface ScrapedLinkedInLead {
  profileUrl: string;
  name: string;
  headline: string;
  location: string;
  connectionDegree: "1st" | "2nd" | "3rd" | "out_of_network";
}

export async function applyLinkedInSession(context: BrowserContext, liAt: string) {
  await context.addCookies([
    { name: "li_at", value: liAt, domain: ".linkedin.com", path: "/", httpOnly: true, secure: true },
  ]);
}

export async function searchLinkedInPeople(page: Page, query: string, maxResults = 15): Promise<ScrapedLinkedInLead[]> {
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await pacedDelay();

  // Scroll a couple of times so lazy-loaded result cards render.
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 1400);
    await pacedDelay();
  }

  const cards = await page.$$('li[class*="reusable-search__result-container"], div[data-view-name="search-entity-result-universal-template"]');
  const results: ScrapedLinkedInLead[] = [];

  for (const card of cards.slice(0, maxResults)) {
    try {
      const anchor = await card.$('a[href*="/in/"]');
      const profileUrl = anchor ? (await anchor.getAttribute("href"))?.split("?")[0] || "" : "";
      if (!profileUrl) continue;

      const nameEl = await card.$('span[aria-hidden="true"]');
      const name = nameEl ? (await nameEl.innerText()).trim() : "";

      const headlineEl = await card.$('div.entity-result__primary-subtitle, div[class*="subtitle"]');
      const headline = headlineEl ? (await headlineEl.innerText()).trim() : "";

      const locationEl = await card.$('div.entity-result__secondary-subtitle, div[class*="secondary-subtitle"]');
      const location = locationEl ? (await locationEl.innerText()).trim() : "";

      const badgeText = (await card.innerText()).toLowerCase();
      const connectionDegree: ScrapedLinkedInLead["connectionDegree"] = badgeText.includes("1st")
        ? "1st"
        : badgeText.includes("2nd")
        ? "2nd"
        : badgeText.includes("3rd")
        ? "3rd"
        : "out_of_network";

      if (name && profileUrl) {
        results.push({ profileUrl, name, headline, location, connectionDegree });
      }
    } catch {
      // one card failing to parse shouldn't abort the whole search
      continue;
    }
  }

  return results;
}

export async function sendLinkedInConnectionRequest(page: Page, profileUrl: string, note?: string): Promise<void> {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
  await pacedDelay();

  let connectButton = await page.$('button[aria-label^="Invite"][aria-label*="connect"]');
  if (!connectButton) {
    const moreButton = await page.$('button[aria-label="More actions"]');
    if (moreButton) {
      await moreButton.click();
      await pacedDelay();
      connectButton = await page.$('div[aria-label="Connect"]');
    }
  }
  if (!connectButton) throw new Error("Connect button not found — you may already be connected, or LinkedIn changed its layout.");

  await connectButton.click();
  await pacedDelay();

  if (note) {
    const addNoteButton = await page.$('button[aria-label="Add a note"]');
    if (addNoteButton) {
      await addNoteButton.click();
      const textarea = await page.$('textarea[name="message"]');
      if (textarea) await textarea.fill(note.slice(0, 300));
    }
  }

  const sendButton = await page.$('button[aria-label="Send"], button[aria-label="Send invitation"], button[aria-label="Send now"]');
  if (!sendButton) throw new Error("Send button not found in the connect dialog.");
  await sendButton.click();
}

export async function sendLinkedInMessage(page: Page, profileUrl: string, text: string): Promise<void> {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
  await pacedDelay();

  const messageButton = await page.$('button[aria-label^="Message"]');
  if (!messageButton) throw new Error("Message button not found — you likely need to be 1st-degree connected first.");
  await messageButton.click();
  await pacedDelay();

  const editor = await page.$('div.msg-form__contenteditable[contenteditable="true"]');
  if (!editor) throw new Error("Message compose box not found.");
  await editor.click();
  await editor.type(text, { delay: 25 });
  await pacedDelay();

  const sendBtn = await page.$('button.msg-form__send-button');
  if (!sendBtn) throw new Error("Send button not found in message compose box.");
  await sendBtn.click();
}
