import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { callGroqVisionStructured } from "@/lib/groq-server";
import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "accessory",
] as const;

function parseModelJson(value: string) {
  const withoutMarkdown = value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const jsonStart = withoutMarkdown.indexOf("{");
  const jsonEnd = withoutMarkdown.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    return JSON.parse(withoutMarkdown.slice(jsonStart, jsonEnd + 1)) as {
      name?: unknown;
      category?: unknown;
      color?: unknown;
    };
  }

  const fields = Object.fromEntries(
    withoutMarkdown.split(/\r?\n/).flatMap((line) => {
      const match = line.match(
        /^\s*(name|category|color)\s*[:=\-]\s*(.+?)\s*$/i,
      );
      return match ? [[match[1].toLowerCase(), match[2]]] : [];
    }),
  );

  if (fields.name || fields.category || fields.color) return fields;
  throw new Error("Vision model returned invalid output");
}

function isImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(value)
  );
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const body = await req.json();
    const imageDataUrl = body?.imageDataUrl;

    if (!isImageDataUrl(imageDataUrl)) {
      return NextResponse.json(
        { error: "File gambar diperlukan untuk dianalisis." },
        { status: 400 },
      );
    }

    if (imageDataUrl.length > 8_000_000) {
      return NextResponse.json(
        { error: "Ukuran gambar terlalu besar. Maksimal 5 MB." },
        { status: 400 },
      );
    }

    const result = await callGroqVisionStructured(
      "You classify clothing images. Do not explain your answer. Return exactly three lines in this format: NAME: [short Indonesian item name]\\nCATEGORY: [top, bottom, outerwear, shoes, or accessory]\\nCOLOR: [dominant Indonesian color]. Never invent details that cannot be seen.",
      "Look at this image and return exactly the three labeled lines requested. Use only the main clothing item.",
      imageDataUrl,
    );
    const parsed = parseModelJson(result);

    const category = CATEGORIES.includes(
      parsed.category as (typeof CATEGORIES)[number],
    )
      ? parsed.category
      : "top";

    return NextResponse.json({
      name: typeof parsed.name === "string" ? parsed.name.trim() : "",
      category,
      color: typeof parsed.color === "string" ? parsed.color.trim() : "",
    });
  } catch (error) {
    console.error("Failed to analyze wardrobe image:", error);
    return NextResponse.json(
      {
        error:
          "Gagal menganalisis gambar. Silakan isi detailnya secara manual.",
      },
      { status: 502 },
    );
  }
}
