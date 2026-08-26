import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
}));
const prisma = vi.hoisted(() => ({
  wardrobeItem: { findMany: vi.fn() },
}));
const groq = vi.hoisted(() => ({
  callGroqStructured: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth })),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/groq-server", () => groq);

import { POST } from "@/app/api/recommend/route";

describe("structured recommendations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-a" } } });
  });

  it("returns only items from the authenticated user's wardrobe", async () => {
    const ownedItem = {
      id: "item-a",
      userId: "user-a",
      name: "White shirt",
      category: "top",
      color: "white",
      tags: [],
    };
    prisma.wardrobeItem.findMany.mockResolvedValue([ownedItem]);
    groq.callGroqStructured.mockResolvedValue(
      JSON.stringify({
        summary: "Clean look",
        itemIds: ["item-a", "item-from-another-user"],
        reasoning: "Works well together",
      }),
    );

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ prompt: "outfit formal" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).items).toEqual([ownedItem]);
    expect(prisma.wardrobeItem.findMany).toHaveBeenCalledWith({
      where: { userId: "user-a" },
    });
  });

  it("rejects requests without authentication", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ prompt: "outfit formal" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(prisma.wardrobeItem.findMany).not.toHaveBeenCalled();
  });
});
