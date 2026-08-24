import type { WardrobeItem } from "./wardrobe";

export type OutfitRecommendationCard = {
  summary: string;
  reasoning?: string;
  items: WardrobeItem[];
};

export type Message = {
  id?: string;
  type: "user" | "ai";
  text: string;
  recommendation?: OutfitRecommendationCard;
};

export type ChatSession = {
  id: string;
  name: string;
  messages: Message[];
};
