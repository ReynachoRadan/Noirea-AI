import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
}));
const prisma = vi.hoisted(() => ({
  wardrobeItem: { findMany: vi.fn() },
  savedOutfit: { create: vi.fn() },
}));

vi.mock("@/lib/auth/get-user", () => auth);
vi.mock("@/lib/prisma", () => ({ prisma }));

import { POST } from "@/app/api/saved-outfits/route";

const unauthorizedResponse = NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 },
);

describe("saved outfit ownership", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getAuthenticatedUser.mockReturnValue({
      user: { id: "user-a" },
      errorResponse: unauthorizedResponse,
    });
  });

  it("rejects an outfit containing an item the user does not own", async () => {
    prisma.wardrobeItem.findMany.mockResolvedValue([{ id: "item-a" }]);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          summary: "Interview look",
          itemIds: ["item-a", "item-b"],
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
    expect(prisma.wardrobeItem.findMany).toHaveBeenCalledWith({
      where: { userId: "user-a", id: { in: ["item-a", "item-b"] } },
      select: { id: true },
    });
    expect(prisma.savedOutfit.create).not.toHaveBeenCalled();
  });

  it("rejects requests without authentication", async () => {
    auth.getAuthenticatedUser.mockReturnValue({
      user: null,
      errorResponse: unauthorizedResponse,
    });

    const response = await POST(
      new NextRequest("http://localhost", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(prisma.savedOutfit.create).not.toHaveBeenCalled();
  });
});
