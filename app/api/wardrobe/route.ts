import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const items = await prisma.wardrobeItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch wardrobe items:", error);
    return NextResponse.json(
      { error: "Failed to fetch wardrobe items" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const body = await req.json();
    const { name, category, color, imageUrl } = body;
    const normalizedImageUrl =
      typeof imageUrl === "string" ? imageUrl.trim() : "";

    if (!name || !category || !color) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, color" },
        { status: 400 },
      );
    }

    if (normalizedImageUrl.length > 8_000_000) {
      return NextResponse.json(
        { error: "Ukuran gambar terlalu besar. Maksimal 5 MB." },
        { status: 400 },
      );
    }

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: user.id,
        name,
        category,
        color,
        imageUrl: normalizedImageUrl || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create wardrobe item:", error);
    return NextResponse.json(
      { error: "Failed to create wardrobe item" },
      { status: 500 },
    );
  }
}
