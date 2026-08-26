import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_OPTIONS, STYLE_OPTIONS, StyleProfile } from "@/types/profile";
import { NextRequest, NextResponse } from "next/server";

const EMPTY_PROFILE: StyleProfile = {
  displayName: "",
  styles: [],
  favoriteColors: "",
  avoidColors: "",
  occasions: "",
  language: "id",
};

function readProfile(metadata: Record<string, unknown>): StyleProfile {
  const value = metadata.styleProfile;
  if (!value || typeof value !== "object") return EMPTY_PROFILE;

  const profile = value as Record<string, unknown>;
  return {
    displayName:
      typeof profile.displayName === "string" ? profile.displayName : "",
    styles: Array.isArray(profile.styles)
      ? profile.styles.filter(
          (style): style is StyleProfile["styles"][number] =>
            typeof style === "string" && STYLE_OPTIONS.includes(style as never),
        )
      : [],
    favoriteColors:
      typeof profile.favoriteColors === "string" ? profile.favoriteColors : "",
    avoidColors:
      typeof profile.avoidColors === "string" ? profile.avoidColors : "",
    occasions: typeof profile.occasions === "string" ? profile.occasions : "",
    language: LANGUAGE_OPTIONS.some(([code]) => code === profile.language)
      ? (profile.language as StyleProfile["language"])
      : "id",
  };
}

export async function GET() {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  return NextResponse.json(readProfile(user.user_metadata ?? {}));
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (!user) return errorResponse;

  try {
    const body = await req.json();
    const profile = readProfile({ styleProfile: body });
    if (
      profile.displayName.length > 80 ||
      profile.favoriteColors.length > 200 ||
      profile.avoidColors.length > 200 ||
      profile.occasions.length > 200
    ) {
      return NextResponse.json(
        { error: "Profil terlalu panjang" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: { styleProfile: profile },
    });
    if (error) throw error;

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to update style profile:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan profil style" },
      { status: 500 },
    );
  }
}
