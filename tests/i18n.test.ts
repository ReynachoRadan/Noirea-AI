import { describe, expect, it } from "vitest";

import { getTranslation } from "@/lib/i18n";

describe("i18n translation helper", () => {
  it("returns a supported locale for the profile screen", () => {
    expect(getTranslation("es").profileTitle).toBe("Tu perfil de estilo");
    expect(getTranslation("en").profileSettings).toBe("Profile settings");
  });

  it("falls back to Indonesian when locale is unsupported", () => {
    expect(getTranslation("xx").wardrobeTitle).toBe("Wardrobe");
  });
});
