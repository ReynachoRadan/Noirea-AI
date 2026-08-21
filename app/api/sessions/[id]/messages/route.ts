import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGroq } from "@/lib/groq-server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id: sessionId } = await params;
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text'" },
        { status: 400 }
      );
    }

    // Pastikan session ini milik user yang login
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Simpan pesan user
    await prisma.message.create({
      data: { sessionId, type: "user", text },
    });

    // Panggil AI, simpan balasannya
    const reply = await callGroq(text);
    const aiMessage = await prisma.message.create({
      data: { sessionId, type: "ai", text: reply },
    });

    return NextResponse.json(aiMessage, { status: 201 });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}