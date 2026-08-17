import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.wardrobeItem.findMany({
      where: { userId: "local-user" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch wardrobe items:", error);
    return NextResponse.json(
      { error: "Failed to fetch wardrobe items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, color, imageUrl } = body;

    if (!name || !category || !color) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, color" },
        { status: 400 }
      );
    }

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: "local-user",
        name,
        category,
        color,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create wardrobe item:", error);
    return NextResponse.json(
      { error: "Failed to create wardrobe item" },
      { status: 500 }
    );
  }
}