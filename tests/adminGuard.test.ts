import { describe, expect, it, vi } from "vitest";
const getUser = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    auth: { getUser },
    from,
  },
}));

describe("requireAdmin", () => {
  it("rejects non-admin users", async () => {
    const { AdminGuardError, requireAdmin } = await import("@/lib/auth/adminGuard");
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "user-1", role: "user" }, error: null }),
    });

    const request = new Request("https://example.com", {
      headers: { authorization: "Bearer test-token" },
    });

    await expect(requireAdmin(request)).rejects.toBeInstanceOf(AdminGuardError);
  });
});
