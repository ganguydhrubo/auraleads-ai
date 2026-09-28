import { describe, it, expect, vi, beforeEach } from "vitest";

// React's `cache()` (used for per-request memoisation) is only provided by
// the canary React build Next.js swaps in for its own webpack graph — plain
// node_modules/react (stable, what Vitest resolves) doesn't export it. Stub
// it as a pass-through here so the test exercises the real query logic
// without needing Next's request-scoping machinery.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: any[]) => any>(fn: T) => fn };
});

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ from: mockFrom }),
}));

const { isUnlimited } = await import("./entitlements");

describe("isUnlimited", () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockEq.mockClear();
    mockMaybeSingle.mockReset();
  });

  it("returns true for a user id present in unlimited_accounts (the owner)", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: "owner-uuid" }, error: null });
    await expect(isUnlimited("owner-uuid")).resolves.toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("unlimited_accounts");
    expect(mockEq).toHaveBeenCalledWith("user_id", "owner-uuid");
  });

  it("returns false for a different, non-allowlisted user id", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(isUnlimited("some-other-user-uuid")).resolves.toBe(false);
  });

  it("has no parameter for a client-supplied email or flag — only a server-verified user id reaches it", async () => {
    // Every real caller passes session.userId, resolved server-side from
    // supabase.auth.getUser() (see lib/supabase/server.ts's
    // getSessionWorkspaceId). The function signature itself accepts nothing
    // else — there is no email/flag argument a client request body could
    // populate — so "spoofing" here can only mean passing an arbitrary id
    // string, which still has to match a real row to return true.
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(isUnlimited("attacker-supplied-uuid-not-the-session-id")).resolves.toBe(false);
  });
});
