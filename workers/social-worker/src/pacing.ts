// Human-like pacing helpers. This is about not looking like a script firing
// requests in lockstep — it is not anti-detection tooling (no fingerprint
// spoofing, no proxy rotation, no CAPTCHA bypass). If a platform flags the
// account anyway, that's the real risk the workspace owner accepted by
// connecting a browser session in the first place.

export function jitter(baseMs: number, spreadPct = 0.4): number {
  const delta = baseMs * spreadPct;
  return Math.round(baseMs - delta + Math.random() * delta * 2);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pacedDelay() {
  const base = Number(process.env.ACTION_DELAY_MS || 4000);
  await sleep(jitter(base));
}
