import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id } = await params;

    const result = await prisma.wardrobeItem.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete wardrobe item:", error);
    return NextResponse.json(
      { error: "Failed to delete wardrobe item" },
      { status: 500 }
    );
  }
}