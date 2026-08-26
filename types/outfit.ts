import { WardrobeItem } from "./wardrobe";

export interface Outfit {
  id: string;
  userId: string;
  name?: string;
  itemIds: string[]; // referensi ke WardrobeItem.id
  occasion?: string; // "casual dinner", "work", "formal event", dll
  savedAt: string;
}

// Bentuk "populated" — dipakai saat outfit ditampilkan dengan detail item lengkap,
// bukan cuma referensi id. Berguna untuk komponen UI, tidak untuk disimpan di storage.
export interface OutfitWithItems extends Omit<Outfit, "itemIds"> {
  items: WardrobeItem[];
}

export interface SavedOutfit {
  id: string;
  userId: string;
  name: string;
  summary: string;
  reasoning?: string | null;
  itemIds: string[];
  createdAt: string;
  items: WardrobeItem[];
}
