"use client";

import WardrobeCard from "@/components/wardrobe/wardrobecard";
import { ClothingCategory, WardrobeItem } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const CATEGORIES: ClothingCategory[] = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "accessory",
];

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ClothingCategory>("top");
  const [color, setColor] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/wardrobe", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to load wardrobe items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !color.trim()) return;

    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          category,
          color: color.trim(),
          imageUrl: imageUrl.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      await fetchItems();

      setName("");
      setColor("");
      setImageUrl("");
    } catch (error) {
      console.error("Failed to add wardrobe item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete wardrobe item:", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition mb-4"
      >
        <ArrowLeft size={16} /> Back to Chat
      </Link>

      <h1 className="text-xl font-medium mb-6">Wardrobe</h1>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl border border-neutral-800 bg-neutral-900"
      >
        <input
          placeholder="Nama item"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[140px] bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ClothingCategory)}
          className="bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none capitalize"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          placeholder="Warna"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-28 bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <input
          placeholder="URL gambar (opsional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="flex-1 min-w-[160px] bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
        >
          Tambah
        </button>
      </form>

      {/* Grid */}
      {isLoading ? (
        <p className="text-neutral-500 text-sm">Memuat wardrobe...</p>
      ) : items.length === 0 ? (
        <p className="text-neutral-500 text-sm">Belum ada item wardrobe.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <WardrobeCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
