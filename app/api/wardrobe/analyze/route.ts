import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { callGroqVisionStructured } from "@/lib/groq-server";
import { NextRequest, NextResponse } from "next/server";

type ClothingCategory = "top" | "bottom" | "outerwear" | "shoes" | "accessory";

type ParsedFields = {
  name?: unknown;
  category?: unknown;
  color?: unknown;
  valid?: unknown;
  confidence?: unknown;
};

function cleanFieldValue(value: string) {
  return value
    .replace(/^[*_`#\-\s]+|[*_`#\-\s]+$/g, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function normalizeItemName(value: unknown) {
  if (typeof value !== "string") return "";
  const name = cleanFieldValue(value)
    .replace(/^\[|\]$/g, "")
    .replace(
      /^(?:the\s+)?(?:item|clothing|garment|product)\s+name\s*(?::|is|=)\s*/i,
      "",
    )
    .replace(/^(?:(?:this|that|the)\s+)?item\s+is\s+/i, "")
    .replace(
      /^(?:it(?:'s| is)|this is|that(?:'s| is)|ini adalah|ini merupakan)\s+/i,
      "",
    )
    .replace(/^(?:(?:a|an|the)\s+)?/i, "")
    .trim();
  return /specific short item name|item name here|enter item name/i.test(name)
    ? ""
    : name;
}

function normalizeColor(value: unknown) {
  if (typeof value !== "string") return "";
  const cleaned = cleanFieldValue(value)
    .toLowerCase()
    .replace(/^(?:a|an|the)\s+/i, "")
    .replace(
      /^(?:primary|dominant|main|deep|light|dark|bright|pale|warna)\s+(?:color|colour|warna)?\s*(?::|is|=)?\s*/i,
      "",
    )
    .replace(/^(?:color|colour|warna)\s*(?::|is|=)\s*/i, "")
    .trim();
  const colors = [
    "hitam",
    "putih",
    "merah",
    "biru",
    "hijau",
    "kuning",
    "cokelat",
    "abu-abu",
    "abu abu",
    "abu",
    "oranye",
    "jingga",
    "ungu",
    "pink",
    "merah muda",
    "biru muda",
    "navy",
    "beige",
    "cream",
    "krem",
    "gold",
    "silver",
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "brown",
    "gray",
    "grey",
    "orange",
    "purple",
    "beige",
    "pink",
  ];
  return (
    colors.find((color) => cleaned === color || cleaned.includes(color)) ??
    cleaned
  );
}

function fieldsFromObject(value: unknown): ParsedFields {
  if (!value || typeof value !== "object") return {};

  const object = value as Record<string, unknown>;
  const getString = (...keys: string[]) => {
    const key = keys.find((candidate) => typeof object[candidate] === "string");
    return key ? cleanFieldValue(object[key] as string) : undefined;
  };

  const fields = {
    name: getString(
      "name",
      "item_name",
      "itemName",
      "clothing_name",
      "product_name",
      "garment_name",
      "item",
    ),
    category: getString("category", "type", "clothing_category"),
    color: getString("color", "dominant_color", "dominantColor"),
    valid: getString("valid", "is_clothing", "isClothing"),
    confidence: getString("confidence", "certainty"),
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
    /(?:^|[\r\n,;{}])\s*[*_`#\-]*(valid|confidence|name|item\s*name|clothing\s*name|category|type|color|dominant\s*color)[*_`\s]*(?::|=|\bis\b|-)\s*([^,;\r\n{}]+?)(?=\s*(?:[,;\r\n{}]|$))/gi;
  const fields: Record<string, string> = {};
  for (const match of withoutMarkdown.matchAll(fieldPattern)) {
    const fieldName = match[1]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace("item_name", "name")
      .replace("clothing_name", "name")
      .replace("product_name", "name")
      .replace("garment_name", "name")
      .replace("dominant_color", "color")
      .replace("type", "category");
    const fieldValue = cleanFieldValue(match[2]);
    if (fieldValue) fields[fieldName] = fieldValue;
  }

  // Some vision models place the labels after a short introductory sentence.
  const inlineFieldPattern =
    /\b(valid|confidence|name|item\s*name|clothing\s*name|product\s*name|garment\s*name|category|type|color|colour|dominant\s*colou?r|primary\s*colou?r)\b\s*(?::|=|\bis\s|-)\s*([^.,;\r\n]+?)(?=\s*(?:[.,;\r\n]|$))/gi;
  for (const match of withoutMarkdown.matchAll(inlineFieldPattern)) {
    const fieldName = match[1]
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace("item_name", "name")
      .replace("clothing_name", "name")
      .replace("product_name", "name")
      .replace("garment_name", "name")
      .replace("dominant_colour", "color")
      .replace("dominant_color", "color")
      .replace("primary_colour", "color")
      .replace("primary_color", "color")
      .replace("colour", "color")
      .replace("type", "category");
    const fieldValue = cleanFieldValue(match[2]);
    if (fieldValue) fields[fieldName] = fieldValue;
  }

  if (fields.name || fields.category || fields.color) return fields;

  const naturalLanguageFields: ParsedFields = {};
  const naturalPatterns = {
    name: /(?:(?:item|clothing|garment|product)\s+name|name)\s*(?::|is|=)\s*([^,.\n]+)/i,
    category: /(?:category|type)\s*(?::|is|=)\s*([^,.\n]+)/i,
    color: /(?:dominant\s+)?colou?r\s*(?::|is|=)\s*([^,.\n]+)/i,
    valid: /valid(?:ity)?\s*(?::|is|=)\s*([^,.\n]+)/i,
    confidence: /confidence\s*(?::|is|=)\s*([^,.\n]+)/i,
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

function normalizeCategory(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim();
  const categoryAliases: Record<ClothingCategory, string[]> = {
    top: [
      "top",
      "shirt",
      "t-shirt",
      "tshirt",
      "kaos",
      "kemeja",
      "blouse",
      "sweater",
      "dress",
    ],
    bottom: [
      "bottom",
      "pants",
      "trousers",
      "jeans",
      "rok",
      "skirt",
      "celana",
      "shorts",
    ],
    outerwear: [
      "outerwear",
      "jacket",
      "coat",
      "blazer",
      "cardigan",
      "jaket",
      "mantel",
    ],
    shoes: [
      "shoes",
      "shoe",
      "footwear",
      "sneaker",
      "sneakers",
      "trainer",
      "trainers",
      "boots",
      "boot",
      "loafer",
      "loafers",
      "heels",
      "high heels",
      "flats",
      "sandal",
      "sandals",
      "sepatu",
      "alas kaki",
    ],
    accessory: [
      "accessory",
      "aksesori",
      "bag",
      "tas",
      "hat",
      "topi",
      "scarf",
      "belt",
      "watch",
    ],
  };

  return (Object.entries(categoryAliases).find(([, aliases]) =>
    aliases.includes(normalized),
  )?.[0] ?? null) as ClothingCategory | null;
}

function inferFieldsFromText(value: string): ParsedFields {
  const text = value.toLowerCase();
  const categoryTerms: Array<[ClothingCategory, string[]]> = [
    [
      "shoes",
      [
        "shoes",
        "shoe",
        "footwear",
        "sneaker",
        "trainer",
        "boots",
        "loafer",
        "heels",
        "flats",
        "sandals",
        "slippers",
        "sepatu",
        "alas kaki",
      ],
    ],
    [
      "outerwear",
      ["outerwear", "jacket", "coat", "blazer", "cardigan", "jaket", "mantel"],
    ],
    [
      "bottom",
      [
        "bottom",
        "pants",
        "trousers",
        "jeans",
        "skirt",
        "shorts",
        "celana",
        "rok",
      ],
    ],
    [
      "accessory",
      ["accessory", "bag", "tas", "hat", "topi", "scarf", "belt", "watch"],
    ],
    [
      "top",
      [
        "top",
        "shirt",
        "t-shirt",
        "tshirt",
        "kaos",
        "kemeja",
        "blouse",
        "sweater",
        "dress",
      ],
    ],
  ];
  const category = categoryTerms.find(([, terms]) =>
    terms.some((term) =>
      new RegExp(`\\b${term.replace(" ", "\\s+")}\\b`, "i").test(text),
    ),
  )?.[0];
  const color = normalizeColor(text);
  return {
    name: category
      ? categoryTerms.find(([key]) => key === category)?.[1][1]
      : undefined,
    category,
    color: color || undefined,
  };
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

    const systemPrompt =
      "You catalog one clothing item from an image. Inspect the object, not the filename. Any footwear (sneaker, boot, loafer, sandal, slipper, or sepatu) MUST be CATEGORY: shoes. Return exactly three lines and no explanation. NAME must start directly with the clothing type, such as 'loafer', 'white sneaker', or 'blue shirt'. Do not write 'item is a', 'it is a', 'this is', 'that is', 'ini adalah', placeholder text, brackets, or any other sentence. Do not copy the words from this instruction. CATEGORY must be exactly one of top, bottom, outerwear, shoes, or accessory. COLOR must be one color name only, with no words like primary, dominant, deep, light, or color. Never invent details.\nNAME: loafer\nCATEGORY: shoes\nCOLOR: white";
    const userPrompt =
      "Identify the main wearable item. If it is footwear, use CATEGORY: shoes. Replace the example values with the values visible in the image. Return only the three labeled lines.";
    let parsed: ParsedFields;
    try {
      const result = await callGroqVisionStructured(
        systemPrompt,
        userPrompt,
        imageDataUrl,
      );
      parsed = parseModelJson(result);
    } catch {
      const retryResult = await callGroqVisionStructured(
        "Look at the image and answer only: NAME: item name; CATEGORY: top/bottom/outerwear/shoes/accessory; COLOR: one color.",
        "Classify the main item. Footwear is shoes.",
        imageDataUrl,
      );
      try {
        parsed = parseModelJson(retryResult);
      } catch {
        parsed = inferFieldsFromText(retryResult);
      }
    }

    const category = normalizeCategory(parsed.category);
    if (!category) {
      return NextResponse.json(
        {
          error:
            "Jenis pakaian belum dapat dikenali. Silakan pilih kategori dan isi detail secara manual.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      name: normalizeItemName(parsed.name),
      category,
      color: normalizeColor(parsed.color),
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
