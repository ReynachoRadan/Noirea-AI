import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
}));
const prisma = vi.hoisted(() => ({
  wardrobeItem: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@/lib/auth/get-user", () => auth);
vi.mock("@/lib/prisma", () => ({ prisma }));

import { DELETE, PATCH } from "@/app/api/wardrobe/[id]/route";
import { GET } from "@/app/api/wardrobe/route";

const unauthorizedResponse = NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 },
);

describe("wardrobe ownership", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getAuthenticatedUser.mockReturnValue({
      user: { id: "user-a" },
      errorResponse: unauthorizedResponse,
    });
  });

  it("only reads the authenticated user's wardrobe", async () => {
    prisma.wardrobeItem.findMany.mockResolvedValue([
      { id: "item-a", userId: "user-a" },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(prisma.wardrobeItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-a" } }),
    );
    await expect(response.json()).resolves.toEqual([
      { id: "item-a", userId: "user-a" },
    ]);
  });

  it("cannot delete another user's wardrobe item", async () => {
    prisma.wardrobeItem.findFirst.mockResolvedValue(null);

    const response = await DELETE(new NextRequest("http://localhost"), {
      params: Promise.resolve({ id: "item-b" }),
    });

    expect(response.status).toBe(404);
    expect(prisma.wardrobeItem.findFirst).toHaveBeenCalledWith({
      where: { id: "item-b", userId: "user-a" },
    });
    expect(prisma.wardrobeItem.deleteMany).not.toHaveBeenCalled();
  });

  it("updates only an item owned by the authenticated user", async () => {
    prisma.wardrobeItem.updateMany.mockResolvedValue({ count: 1 });
    prisma.wardrobeItem.findFirst.mockResolvedValue({
      id: "item-a",
      userId: "user-a",
      name: "Updated shirt",
      category: "top",
      color: "black",
      imageUrl: null,
    });

    const response = await PATCH(
      new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Updated shirt",
          category: "top",
          color: "black",
          imageUrl: "",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "item-a" }) },
    );

    expect(response.status).toBe(200);
    expect(prisma.wardrobeItem.updateMany).toHaveBeenCalledWith({
      where: { id: "item-a", userId: "user-a" },
      data: {
        name: "Updated shirt",
        category: "top",
        color: "black",
        imageUrl: null,
      },
    });
    await expect(response.json()).resolves.toMatchObject({
      id: "item-a",
      name: "Updated shirt",
    });
  });

  it("rejects requests without authentication", async () => {
    auth.getAuthenticatedUser.mockReturnValue({
      user: null,
      errorResponse: unauthorizedResponse,
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(prisma.wardrobeItem.findMany).not.toHaveBeenCalled();
  });
});
