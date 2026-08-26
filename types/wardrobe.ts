// types/wardrobe.ts
export type ClothingCategory =
  | "top" | "bottom" | "outerwear" | "shoes" | "accessory";

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  category: ClothingCategory;
  color: string;
  imageUrl: string;
  tags?: string[];
  createdAt: string;
}