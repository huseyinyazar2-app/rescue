import { describe, expect, it } from "vitest";
import { prepareBatchTags } from "@/lib/admin/batches";

describe("prepareBatchTags", () => {
  it("creates the requested quantity of unique tags", async () => {
    const tags = await prepareBatchTags(10);
    const codes = new Set(tags.map((tag) => tag.public_code));
    expect(tags).toHaveLength(10);
    expect(codes.size).toBe(10);
  });
});
