import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

export async function GET() {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        name: "New Chat",
      },
      include: { messages: true },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}