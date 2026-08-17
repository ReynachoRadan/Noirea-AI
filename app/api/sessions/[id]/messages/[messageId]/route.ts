import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGroq } from "@/lib/groq-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id: sessionId, messageId } = await params;
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text'" },
        { status: 400 }
      );
    }

    const allMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    const editedIndex = allMessages.findIndex((m) => m.id === messageId);
    if (editedIndex === -1) {
      return NextResponse.json(
        { error: "Message not found in this session" },
        { status: 404 }
      );
    }

    const messagesToDelete = allMessages.slice(editedIndex + 1);
    if (messagesToDelete.length > 0) {
      await prisma.message.deleteMany({
        where: { id: { in: messagesToDelete.map((m) => m.id) } },
      });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { text },
    });

    const reply = await callGroq(text);
    const aiMessage = await prisma.message.create({
      data: { sessionId, type: "ai", text: reply },
    });

    return NextResponse.json(aiMessage);
  } catch (error) {
    console.error("Failed to edit message:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
}