export const STYLE_OPTIONS = [
  "casual",
  "minimalist",
  "formal",
  "streetwear",
  "sporty",
  "vintage",
] as const;

export type StyleOption = (typeof STYLE_OPTIONS)[number];

export const LANGUAGE_OPTIONS = [
  ["id", "Bahasa Indonesia"],
  ["en", "English"],
  ["es", "Español"],
  ["zh", "中文"],
  ["hi", "हिन्दी"],
  ["ar", "العربية"],
  ["pt", "Português"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["ja", "日本語"],
  ["ko", "한국어"],
] as const;

export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number][0];

export type StyleProfile = {
  displayName: string;
  styles: StyleOption[];
  favoriteColors: string;
  avoidColors: string;
  occasions: string;
  language: LanguageOption;
};
