import { describe, expect, it, vi } from "vitest";
const getUser = vi.fn();
const from = vi.fn();
const writeAuditLog = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    auth: { getUser },
    from,
  },
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog,
}));

describe("sighting detail audit", () => {
  it("writes audit log on sensitive view", async () => {
    const { GET } = await import("@/app/api/admin/sightings/[id]/route");
    getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "admin-1", role: "admin" }, error: null }),
        };
      }
      if (table === "sightings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "sighting-1", pet_id: "pet-1" },
            error: null,
          }),
        };
      }
      return {};
    });

    const request = new Request("https://example.com/api/admin/sightings/sighting-1", {
      headers: { authorization: "Bearer test-token" },
    });

    const response = await GET(request, { params: { id: "sighting-1" } });
    expect(response.status).toBe(200);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ADMIN_VIEW_SENSITIVE", targetType: "sighting" })
    );
  });
});
