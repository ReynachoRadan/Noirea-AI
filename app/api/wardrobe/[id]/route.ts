import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import {
  removeWardrobeImage,
  storeWardrobeImage,
  WardrobeStorageError,
} from "@/lib/supabase/storage";
import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "accessory",
] as const;

function isCategory(value: unknown): value is (typeof CATEGORIES)[number] {
  return typeof value === "string" && CATEGORIES.includes(value as never);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, category, color, imageUrl } = body;
    const normalizedImageUrl =
      typeof imageUrl === "string" ? imageUrl.trim() : "";

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !isCategory(category) ||
      typeof color !== "string" ||
      !color.trim()
    ) {
      return NextResponse.json(
        { error: "Name, category, and color are required" },
        { status: 400 },
      );
    }

    if (normalizedImageUrl.length > 8_000_000) {
      return NextResponse.json(
        { error: "Ukuran gambar terlalu besar. Maksimal 5 MB." },
        { status: 400 },
      );
    }

    const currentItem = await prisma.wardrobeItem.findFirst({
      where: { id, userId: user.id },
    });
    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const storedImageUrl = await storeWardrobeImage(
      user.id,
      normalizedImageUrl,
    );

    const result = await prisma.wardrobeItem.updateMany({
      where: { id, userId: user.id },
      data: {
        name: name.trim(),
        category,
        color: color.trim(),
        imageUrl: storedImageUrl,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (currentItem.imageUrl && currentItem.imageUrl !== storedImageUrl) {
      await removeWardrobeImage(currentItem.imageUrl);
    }

    const item = await prisma.wardrobeItem.findFirst({
      where: { id, userId: user.id },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update wardrobe item:", error);
    if (error instanceof WardrobeStorageError) {
      return NextResponse.json(
        {
          error:
            "Penyimpanan gambar belum dikonfigurasi. Buat bucket Supabase Storage bernama wardrobe-images terlebih dahulu.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update wardrobe item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id } = await params;

    const item = await prisma.wardrobeItem.findFirst({
      where: { id, userId: user.id },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const result = await prisma.wardrobeItem.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await removeWardrobeImage(item.imageUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete wardrobe item:", error);
    return NextResponse.json(
      { error: "Failed to delete wardrobe item" },
      { status: 500 },
    );
  }
}
