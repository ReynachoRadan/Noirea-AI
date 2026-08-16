import { WardrobeItem } from "./wardrobe";

export interface StyleRequest {
  prompt: string;
  wardrobeContext?: WardrobeItem[];
}

export interface StyleRecommendation {
  summary: string;
  items: WardrobeItem[];
  reasoning?: string;
}