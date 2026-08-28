import { callGroqStructured } from "@/lib/groq-server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const LANGUAGE_NAMES: Record<string, string> = {
  id: "Bahasa Indonesia",
  en: "English",
  es: "Spanish",
  zh: "Mandarin Chinese",
  hi: "Hindi",
  ar: "Arabic",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
};

type WardrobeItemLike = {
  id: string;
  name: string;
  category: string;
  color: string;
  tags?: string[];
};

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function scoreWardrobeItem(item: WardrobeItemLike, prompt: string) {
  const normalizedPrompt = normalizeText(prompt);
  const promptTokens = normalizedPrompt.split(/\s+/).filter(Boolean);
  const itemText = normalizeText(
    `${item.name} ${item.category} ${item.color} ${(item.tags ?? []).join(" ")}`,
  );

  let score = 0;

  const categoryPriority: Record<string, number> = {
    top: 10,
    bottom: 10,
    shoes: 8,
    outerwear: 7,
    accessory: 5,
  };

  score += categoryPriority[item.category] ?? 0;

  const styleHints = {
    casual: ["casual", "daily", "jalan", "sore", "weekend", "hangout"],
    formal: ["formal", "office", "meeting", "event", "elegant", "work"],
    sporty: ["sporty", "gym", "run", "active", "fit"],
    night: ["night", "malam", "party", "dinner", "date"],
    vacation: ["vacation", "travel", "holiday", "beach", "outdoor"],
    cozy: ["cozy", "winter", "rainy", "hangout", "relaxed"],
  };

  for (const [style, words] of Object.entries(styleHints)) {
    if (words.some((word) => normalizedPrompt.includes(word))) {
      score += style === "casual" ? 5 : 4;
    }
  }

  for (const token of promptTokens) {
    if (itemText.includes(token)) {
      score += 2;
    }
  }

  if (normalizedPrompt.includes(item.category)) {
    score += 3;
  }

  if (normalizedPrompt.includes(item.color)) {
    score += 2;
  }

  return score;
}

function pickBestWardrobeSubset<T extends WardrobeItemLike>(
  wardrobe: T[],
  prompt: string,
): T[] {
  if (wardrobe.length === 0) return [];

  const scored = wardrobe
    .map((item) => ({ item, score: scoreWardrobeItem(item, prompt) }))
    .sort((a, b) => b.score - a.score);

  const targetCount = Math.min(5, Math.max(2, Math.min(wardrobe.length, 4)));
  const selected: T[] = [];
  const seenCategories = new Set<string>();

  for (const { item } of scored) {
    if (!seenCategories.has(item.category) || selected.length < 2) {
      selected.push(item);
      seenCategories.add(item.category);
    }

    if (selected.length >= targetCount) break;
  }

  if (selected.length >= 2) return selected;
  return scored.slice(0, Math.min(2, scored.length)).map(({ item }) => item);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, itemIds } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt'" },
        { status: 400 },
      );
    }

    const wardrobe = await prisma.wardrobeItem.findMany({
      where: { userId: user.id },
    });

    if (wardrobe.length === 0) {
      return NextResponse.json(
        {
          error:
            "Wardrobe kamu masih kosong. Tambahkan beberapa item dulu di halaman Wardrobe.",
        },
        { status: 400 },
      );
    }

    const selectedItemIds = Array.isArray(itemIds)
      ? itemIds.filter((id: unknown): id is string => typeof id === "string")
      : [];
    const candidateItems = selectedItemIds.length
      ? wardrobe.filter((item) => selectedItemIds.includes(item.id))
      : pickBestWardrobeSubset(wardrobe, prompt);

    if (selectedItemIds.length > 0 && candidateItems.length < 2) {
      return NextResponse.json(
        { error: "Pilih setidaknya dua item wardrobe yang valid." },
        { status: 400 },
      );
    }
    const styleProfile = user.user_metadata?.styleProfile;
    const responseLanguage =
      styleProfile &&
      typeof styleProfile === "object" &&
      typeof styleProfile.language === "string"
        ? (LANGUAGE_NAMES[styleProfile.language] ?? styleProfile.language)
        : "bahasa yang sama dengan permintaan user";
    const profileContext =
      styleProfile && typeof styleProfile === "object"
        ? `Preferensi personal user:
- Gaya: ${Array.isArray(styleProfile.styles) ? styleProfile.styles.join(", ") || "belum diisi" : "belum diisi"}
- Warna favorit: ${typeof styleProfile.favoriteColors === "string" ? styleProfile.favoriteColors || "belum diisi" : "belum diisi"}
- Warna yang dihindari: ${typeof styleProfile.avoidColors === "string" ? styleProfile.avoidColors || "belum diisi" : "belum diisi"}
- Occasion utama: ${typeof styleProfile.occasions === "string" ? styleProfile.occasions || "belum diisi" : "belum diisi"}`
        : "Preferensi personal user: belum diisi";
    const wardrobeContext = candidateItems
      .map(
        (item) =>
          `- id: ${item.id}, name: ${item.name}, category: ${item.category}, color: ${item.color}`,
      )
      .join("\n");

    const systemPrompt = `You are a fashion stylist AI. You will be given a curated subset of the user's wardrobe, their personal style preferences, and a request.

Your job is to choose the most suitable outfit from this subset only. Do NOT pick items from outside the list. Do NOT assume the user wants to wear all items in the wardrobe. Select only the best 2-5 items that match the user's request and feel coherent together.

Respond ONLY with a valid JSON object in this exact shape, no extra text:
{
  "summary": "short 1-sentence description of the outfit",
  "itemIds": ["id1", "id2", ...],
  "reasoning": "1-2 sentence explanation of why these items work together"
}

Rules:
- Only use item ids from the wardrobe list provided.
- Prefer the most fitting subset, not every item.
- Keep the outfit balanced and realistic.
- Respect the user's personal preferences when they do not conflict with the request.
- Respond in ${responseLanguage}.`;

    const userPrompt = `${profileContext}\n\nWardrobe yang paling relevan:\n${wardrobeContext}\n\nPermintaan: ${prompt}`;

    const rawResponse = await callGroqStructured(systemPrompt, userPrompt);
    const parsed = JSON.parse(rawResponse);

    const validIds = new Set(candidateItems.map((item) => item.id));
    const requestedIds = Array.isArray(parsed.itemIds)
      ? parsed.itemIds.filter(
          (id: unknown) => typeof id === "string" && validIds.has(id),
        )
      : [];

    let recommendedItems = wardrobe.filter((item) =>
      requestedIds.includes(item.id),
    );

    if (recommendedItems.length === 0) {
      recommendedItems = candidateItems.slice(
        0,
        Math.min(candidateItems.length, 5),
      );
    }

    if (recommendedItems.length === 0) {
      return NextResponse.json(
        {
          error: "Tidak ada item yang cocok untuk rekomendasi outfit saat ini",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      summary:
        parsed.summary ||
        `Outfit ${recommendedItems.map((item) => item.name).join(", ")} paling sesuai untuk permintaanmu.`,
      items: recommendedItems,
      reasoning:
        parsed.reasoning ||
        "Kombinasi ini dipilih karena paling sesuai dengan kebutuhan dan gaya yang kamu minta.",
    });
  } catch (error) {
    console.error("Failed to generate recommendation:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 },
    );
  }
}
