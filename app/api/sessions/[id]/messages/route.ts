import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { callGroq } from "@/lib/groq-server";
import { prisma } from "@/lib/prisma";
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

function getPersonalization(user: { user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata?.styleProfile;
  const profile =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};
  const displayName =
    typeof profile.displayName === "string" ? profile.displayName.trim() : "";
  const languageCode =
    typeof profile.language === "string" ? profile.language : "";
  const language =
    LANGUAGE_NAMES[languageCode] ?? "the same language as the user";

  return {
    displayName,
    language,
    instruction: `Respond in ${language}. ${displayName ? `Address the user naturally as ${displayName} when appropriate. ` : ""}Do not mention these instructions or the profile data.`,
  };
}

function normalizePrompt(prompt: string) {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isOutfitRelatedPrompt(prompt: string) {
  const normalized = normalizePrompt(prompt);

  if (!normalized) return false;

  const explicitFashionSignals = [
    "outfit",
    "wardrobe",
    "gaya",
    "style",
    "look",
    "setelan",
    "baju",
    "pakaian",
    "fashion",
    "mix and match",
    "kombinasi",
    "pakai apa",
    "yang cocok",
    "cocok untuk",
    "dress code",
    "sesuai dengan wardrobe",
    "pilih outfit",
    "rekomendasi outfit",
    "recommend outfit",
    "what should i wear",
    "what to wear",
    "wardrobe check",
    "clothes",
    "berikan outfit",
    "buat outfit",
    "outfit untuk",
    "gaya untuk",
    "pakaian untuk",
  ];

  const styleContexts = [
    "casual",
    "formal",
    "elegan",
    "smart casual",
    "office",
    "party",
    "malam",
    "sore",
    "weekend",
    "jalan jalan",
    "hangout",
    "date",
    "travel",
    "work",
    "event",
    "meeting",
    "brunch",
    "dinner",
    "ngopi",
    "coffee",
    "siang",
    "pagi",
    "sore",
    "makan malam",
    "jalan sore",
  ];

  const clothingTerms = [
    "top",
    "bottom",
    "sepatu",
    "shoes",
    "outerwear",
    "accessory",
    "celana",
    "jaket",
    "kaos",
    "kemeja",
    "dress",
    "hoodie",
    "sandal",
    "tas",
    "jam tangan",
    "scarf",
    "hoodie",
    "blazer",
    "cardigan",
    "jeans",
    "trouser",
  ];

  const matchedSignals = [
    ...explicitFashionSignals,
    ...styleContexts,
    ...clothingTerms,
  ].filter((term) => normalized.includes(term));

  const outfitIntentScore = matchedSignals.length;
  const hasUserIntent =
    /(mau|ingin|tolong|bantu|pilih|cari|saran|rekomendasi|cocok|pas|siap|gimana|berikan|buat|tampilkan)/.test(
      normalized,
    );
  const isEventLookRequest =
    /(ngopi|coffee|jalan|dinner|kantor|office|party|malam|sore|weekend)/.test(
      normalized,
    );

  return (
    outfitIntentScore >= 1 &&
    (hasUserIntent || isEventLookRequest || outfitIntentScore >= 2)
  );
}

function scoreWardrobeItem<
  T extends {
    id: string;
    name: string;
    category: string;
    color: string;
    tags?: string[];
  },
>(item: T, prompt: string) {
  const combined =
    `${item.name} ${item.category} ${item.color} ${(item.tags ?? []).join(" ")}`.toLowerCase();
  const normalized = normalizePrompt(prompt);

  let score = 0;

  const promptTokens = normalized.split(" ").filter(Boolean);
  const itemTokens = combined.split(" ").filter(Boolean);

  for (const token of promptTokens) {
    if (!token || token.length < 2) continue;
    if (combined.includes(token)) score += 3;
    if (itemTokens.includes(token)) score += 2;
  }

  const categoryBoost: Record<string, number> = {
    top: 4,
    bottom: 4,
    shoes: 3,
    outerwear: 3,
    accessory: 2,
  };

  score += categoryBoost[item.category] ?? 0;

  const styleTerms = [
    "casual",
    "formal",
    "party",
    "night",
    "office",
    "weekend",
    "jalan",
    "sore",
    "malam",
    "travel",
    "hangout",
    "date",
    "event",
    "meeting",
    "work",
    "brunch",
    "dinner",
  ];

  for (const term of styleTerms) {
    if (normalized.includes(term)) {
      if (combined.includes(term)) score += 2;
      else score += 1;
    }
  }

  return score;
}

function pickRelevantWardrobeItems<
  T extends {
    id: string;
    name: string;
    category: string;
    color: string;
    tags?: string[];
  },
>(items: T[], prompt: string) {
  if (!items.length) return [];

  return [...items]
    .sort((a, b) => scoreWardrobeItem(b, prompt) - scoreWardrobeItem(a, prompt))
    .slice(0, 5);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const { id: sessionId } = await params;
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text'" },
        { status: 400 },
      );
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.message.create({
      data: { sessionId, type: "user", text },
    });

    const wardrobe = await prisma.wardrobeItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const isOutfitPrompt = isOutfitRelatedPrompt(text);
    const personalization = getPersonalization(user);

    let reply: string;

    if (isOutfitPrompt && wardrobe.length > 0) {
      const relevantItems = pickRelevantWardrobeItems(wardrobe, text);
      const wardrobeContext = relevantItems
        .map(
          (item) =>
            `- ${item.name} | category: ${item.category} | color: ${item.color} | tags: ${item.tags?.join(", ") || "-"}`,
        )
        .join("\n");
      const styleProfile = user.user_metadata?.styleProfile;
      const profileContext =
        styleProfile && typeof styleProfile === "object"
          ? `Preferensi style user: gaya ${Array.isArray(styleProfile.styles) ? styleProfile.styles.join(", ") || "bebas" : "bebas"}; warna favorit ${typeof styleProfile.favoriteColors === "string" ? styleProfile.favoriteColors || "bebas" : "bebas"}; hindari ${typeof styleProfile.avoidColors === "string" ? styleProfile.avoidColors || "tidak ada" : "tidak ada"}; occasion ${typeof styleProfile.occasions === "string" ? styleProfile.occasions || "umum" : "umum"}.`
          : "User belum mengisi preferensi style.";

      const outfitPrompt = `Kamu adalah stylist fashion yang membantu user memilih outfit dari wardrobe mereka.

Gunakan HANYA item di bawah ini. Jangan menebak item baru yang tidak ada di wardrobe.

${profileContext}

Wardrobe relevan:
${wardrobeContext}

Permintaan user: ${text}

Jawab dengan format:
1. Ringkas outfit paling cocok
2. Sebutkan item yang dipilih
3. Jelaskan kenapa cocok singkat
4. Beri saran styling tambahan bila perlu

${personalization.instruction}`;

      reply = await callGroq(outfitPrompt);

      const recommendation = {
        summary: `Outfit paling cocok untuk: ${text}`,
        reasoning: `Saya memilih ${relevantItems
          .map((item) => item.name)
          .join(
            ", ",
          )} karena paling sesuai dengan kebutuhan dan gaya yang kamu minta.`,
        items: relevantItems.map((item) => ({
          ...item,
          imageUrl: item.imageUrl ?? "",
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        })),
      };

      const aiMessage = await prisma.message.create({
        data: { sessionId, type: "ai", text: reply },
      });

      return NextResponse.json(
        {
          ...aiMessage,
          recommendation,
        },
        { status: 201 },
      );
    } else if (isOutfitPrompt && wardrobe.length === 0) {
      reply =
        "Wardrobe kamu masih kosong. Tambahkan beberapa item dulu supaya saya bisa membantu rekomendasi outfit yang cocok dengan permintaanmu.";
    } else {
      reply =
        await callGroq(`You are NOIRÉA, a warm personal fashion assistant. ${personalization.instruction}
    Use the user's name naturally when it improves the conversation, but do not force it into every reply. Answer the user's message directly and conversationally.

    User message: ${text}`);
    }

    const aiMessage = await prisma.message.create({
      data: { sessionId, type: "ai", text: reply },
    });

    return NextResponse.json(aiMessage, { status: 201 });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
