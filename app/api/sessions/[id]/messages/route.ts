import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGroq } from "@/lib/groq-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text'" },
        { status: 400 }
      );
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