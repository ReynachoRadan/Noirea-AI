import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const [outfits, wardrobeItems] = await prisma.$transaction([
      prisma.savedOutfit.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.wardrobeItem.findMany({ where: { userId: user.id } }),
    ]);

    const itemsById = new Map(wardrobeItems.map((item) => [item.id, item]));

    return NextResponse.json(
      outfits.map((outfit) => ({
        ...outfit,
        items: outfit.itemIds
          .map((itemId) => itemsById.get(itemId))
          .filter((item): item is (typeof wardrobeItems)[number] =>
            Boolean(item),
          ),
      })),
    );
  } catch (error) {
    console.error("Failed to fetch saved outfits:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved outfits" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const body = await req.json();
    const { name, summary, reasoning, itemIds } = body;

    if (
      typeof summary !== "string" ||
      !summary.trim() ||
      !Array.isArray(itemIds) ||
      itemIds.length === 0 ||
      itemIds.some((itemId) => typeof itemId !== "string")
    ) {
      return NextResponse.json(
        { error: "Summary and at least one valid item id are required" },
        { status: 400 },
      );
    }

    const uniqueItemIds = [...new Set(itemIds as string[])];
    const ownedItems = await prisma.wardrobeItem.findMany({
      where: { userId: user.id, id: { in: uniqueItemIds } },
      select: { id: true },
    });

    if (ownedItems.length !== uniqueItemIds.length) {
      return NextResponse.json(
        { error: "One or more outfit items are not owned by this user" },
        { status: 403 },
      );
    }

    const outfit = await prisma.savedOutfit.create({
      data: {
        userId: user.id,
        name:
          typeof name === "string" && name.trim()
            ? name.trim()
            : "Saved outfit",
        summary: summary.trim(),
        reasoning:
          typeof reasoning === "string" && reasoning.trim()
            ? reasoning.trim()
            : null,
        itemIds: uniqueItemIds,
      },
    });

    return NextResponse.json(outfit, { status: 201 });
  } catch (error) {
    console.error("Failed to save outfit:", error);
    return NextResponse.json(
      { error: "Failed to save outfit" },
      { status: 500 },
    );
  }
}
