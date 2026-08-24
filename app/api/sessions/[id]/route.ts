import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id } = await params;
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'name'" },
        { status: 400 }
      );
    }

    const result = await prisma.chatSession.updateMany({
      where: { id, userId: user.id },
      data: { name },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = await prisma.chatSession.findUnique({ where: { id } });
    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to rename session:", error);
    return NextResponse.json(
      { error: "Failed to rename session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id } = await params;

    const result = await prisma.chatSession.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}