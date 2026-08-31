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
    top: 12,
    bottom: 12,
    shoes: 10,
    outerwear: 8,
    accessory: 6,
  };

  score += categoryPriority[item.category] ?? 0;

  const textureBoost = ["cotton", "linen", "denim", "leather", "knit", "silk"]
    .some((keyword) => itemText.includes(keyword))
    ? 2
    : 0;
  score += textureBoost;

  const styleHints: Record<string, string[]> = {
    casual: ["casual", "daily", "jalan", "sore", "weekend", "hangout", "streetwear"],
    formal: ["formal", "office", "meeting", "event", "elegant", "work", "smart"],
    sporty: ["sporty", "gym", "run", "active", "fit", "athleisure"],
    night: ["night", "malam", "party", "dinner", "date", "going out"],
    vacation: ["vacation", "travel", "holiday", "beach", "outdoor", "trip"],
    cozy: ["cozy", "winter", "rainy", "relaxed", "comfort"],
  };

  for (const [style, words] of Object.entries(styleHints)) {
    if (words.some((word) => normalizedPrompt.includes(word))) {
      score += style === "casual" ? 5 : 4;
      if (item.category === "top" && ["casual", "cozy", "night"].includes(style)) score += 2;
      if (item.category === "bottom" && style === "formal") score += 2;
      if (item.category === "shoes" && ["night", "formal", "casual"].includes(style)) score += 2;
    }
  }

  for (const token of promptTokens) {
    if (!token || token.length < 2) continue;
    if (itemText.includes(token)) score += 3;
    if (item.name.toLowerCase().includes(token)) score += 2;
  }

  const colorWeights: Record<string, number> = {
    black: 2,
    white: 2,
    navy: 2,
    blue: 2,
    brown: 2,
    beige: 2,
    cream: 2,
    grey: 1,
    gray: 1,
    green: 1,
    red: 1,
    yellow: 1,
    pink: 1,
  };

  const colorNames = Object.keys(colorWeights);
  for (const colorName of colorNames) {
    if (normalizedPrompt.includes(colorName) && itemText.includes(colorName)) {
      score += colorWeights[colorName];
    }
  }

  if (normalizedPrompt.includes(item.category)) {
    score += 4;
  }

  if (normalizedPrompt.includes("top") && item.category === "top") score += 3;
  if (normalizedPrompt.includes("bottom") && item.category === "bottom") score += 3;
  if (normalizedPrompt.includes("shoes") && item.category === "shoes") score += 3;

  if (normalizedPrompt.includes(item.color)) {
    score += 2;
  }

  const neutralBonus = /black|white|beige|navy|grey|gray|brown/.test(item.color.toLowerCase()) ? 2 : 0;
  score += neutralBonus;

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

  const categoryOrder = ["top", "bottom", "shoes", "outerwear", "accessory"];
  const selected: T[] = [];
  const seenCategories = new Set<string>();

  for (const category of categoryOrder) {
    const best = scored.find(
      ({ item }) => item.category === category && !seenCategories.has(item.category),
    );

    if (best) {
      selected.push(best.item);
      seenCategories.add(best.item.category);
    }
  }

  for (const { item } of scored) {
    if (!seenCategories.has(item.category)) {
      selected.push(item);
      seenCategories.add(item.category);
    }

    if (selected.length >= 5) break;
  }

  if (selected.length >= 2) return selected.slice(0, 5);
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

    const wardrobe: Awaited<
      ReturnType<typeof prisma.wardrobeItem.findMany>
    > = await prisma.wardrobeItem.findMany({
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
    const candidateItems: Array<(typeof wardrobe)[number]> = selectedItemIds.length
      ? wardrobe.filter((item: (typeof wardrobe)[number]) =>
          selectedItemIds.includes(item.id),
        )
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
        (item: (typeof candidateItems)[number]) =>
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
- Favor one strong item from each essential category when available: top, bottom, shoes, and accessory/outerwear.
- Avoid stacking multiple items from the same category unless the wardrobe is limited.
- Respect the user's personal preferences when they do not conflict with the request.
- Respond in ${responseLanguage}.`;

    const userPrompt = `${profileContext}\n\nWardrobe yang paling relevan:\n${wardrobeContext}\n\nPermintaan: ${prompt}`;

    const rawResponse = await callGroqStructured(systemPrompt, userPrompt);
    const parsed = JSON.parse(rawResponse) as {
      summary?: string;
      reasoning?: string;
      itemIds?: unknown[];
    };

    const validIds = new Set(
      candidateItems.map((item: (typeof candidateItems)[number]) => item.id),
    );
    const requestedIds = Array.isArray(parsed.itemIds)
      ? parsed.itemIds.filter(
          (id: unknown) => typeof id === "string" && validIds.has(id),
        )
      : [];

    let recommendedItems = wardrobe.filter((item: (typeof wardrobe)[number]) =>
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
