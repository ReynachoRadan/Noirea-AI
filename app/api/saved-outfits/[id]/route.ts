import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id } = await params;
    const result = await prisma.savedOutfit.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Saved outfit not found" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete saved outfit:", error);
    return NextResponse.json(
      { error: "Failed to delete saved outfit" },
      { status: 500 },
    );
  }
}
