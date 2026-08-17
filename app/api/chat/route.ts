import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq-server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'prompt' in request body" },
      { status: 400 }
    );
  }

  try {
    const reply = await callGroq(prompt);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}