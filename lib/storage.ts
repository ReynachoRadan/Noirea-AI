import { ChatSession, WardrobeItem } from "@/types";

const STORAGE_KEY = "chat-sessions";
const WARDROBE_KEY = "wardrobe-items";

export function loadSessions(): ChatSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    console.error("Failed to save sessions");
  }
}

export function loadWardrobe(): WardrobeItem[] {
  try {
    const data = localStorage.getItem(WARDROBE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWardrobe(items: WardrobeItem[]) {
  try {
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(items));
  } catch {
    console.error("Failed to save wardrobe items");
  }
}