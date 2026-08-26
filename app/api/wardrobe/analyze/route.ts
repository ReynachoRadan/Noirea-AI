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

type ParsedFields = {
  name?: unknown;
  category?: unknown;
  color?: unknown;
};

function cleanFieldValue(value: string) {
  return value
    .replace(/^[*_`#\-\s]+|[*_`#\-\s]+$/g, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function fieldsFromObject(value: unknown): ParsedFields {
  if (!value || typeof value !== "object") return {};

  const object = value as Record<string, unknown>;
  const getString = (...keys: string[]) => {
    const key = keys.find((candidate) => typeof object[candidate] === "string");
    return key ? cleanFieldValue(object[key] as string) : undefined;
  };

  const fields = {
    name: getString("name", "item_name", "itemName", "clothing_name"),
    category: getString("category", "type", "clothing_category"),
    color: getString("color", "dominant_color", "dominantColor"),
  };

  if (fields.name || fields.category || fields.color) return fields;

  for (const nestedValue of Object.values(object)) {
    const nestedFields = fieldsFromObject(nestedValue);
    if (nestedFields.name || nestedFields.category || nestedFields.color) {
      return nestedFields;
    }
  }

  return {};
}

function parseModelJson(value: string) {
  const withoutReasoning = value
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\|(?:assistant|analysis|final)\|>/gi, "")
    .replace(/\\n/g, "\n")
    .trim();
  const withoutMarkdown = withoutReasoning
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const jsonStart = withoutMarkdown.indexOf("{");
  const jsonEnd = withoutMarkdown.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(withoutMarkdown.slice(jsonStart, jsonEnd + 1));
      const object = Array.isArray(parsed) ? parsed[0] : parsed;
      const fields = fieldsFromObject(object);
      if (fields.name || fields.category || fields.color) return fields;
    } catch {
      // Fall through to the labeled-text parser for malformed JSON wrappers.
    }
  }

  const fieldPattern =
    /(?:^|[\r\n,;{}])\s*[*_`#\-]*(name|item\s*name|clothing\s*name|category|type|color|dominant\s*color)[*_`\s]*(?::|=|\bis\b|-)\s*([^,;\r\n{}]+?)(?=\s*(?:[,;\r\n{}]|$))/gi;
  const fields: Record<string, string> = {};
  for (const match of withoutMarkdown.matchAll(fieldPattern)) {
    const fieldName = match[1]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace("item_name", "name")
      .replace("clothing_name", "name")
      .replace("dominant_color", "color")
      .replace("type", "category");
    const fieldValue = cleanFieldValue(match[2]);
    if (fieldValue) fields[fieldName] = fieldValue;
  }

  if (fields.name || fields.category || fields.color) return fields;

  const naturalLanguageFields: ParsedFields = {};
  const naturalPatterns = {
    name: /(?:item|clothing|garment)\s+name\s*(?::|is|=)\s*([^,.\n]+)/i,
    category: /(?:category|type)\s*(?::|is|=)\s*([^,.\n]+)/i,
    color: /(?:dominant\s+)?colou?r\s*(?::|is|=)\s*([^,.\n]+)/i,
  } as const;

  for (const [field, pattern] of Object.entries(naturalPatterns)) {
    const match = withoutMarkdown.match(pattern);
    if (match?.[1])
      naturalLanguageFields[field as keyof ParsedFields] = cleanFieldValue(
        match[1],
      );
  }

  if (
    naturalLanguageFields.name ||
    naturalLanguageFields.category ||
    naturalLanguageFields.color
  ) {
    return naturalLanguageFields;
  }

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
