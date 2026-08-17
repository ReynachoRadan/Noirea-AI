import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.wardrobeItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete wardrobe item:", error);
    return NextResponse.json(
      { error: "Failed to delete wardrobe item" },
      { status: 500 }
    );
  }
}