"use client";

import { useEffect, useState } from "react";
import { WardrobeItem, ClothingCategory } from "@/types";
import { loadWardrobe, saveWardrobe } from "@/lib/storage";
import WardrobeCard from "@/components/wardrobe/wardrobecard";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const CATEGORIES: ClothingCategory[] = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "accessory",
];

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ClothingCategory>("top");
  const [color, setColor] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    setItems(loadWardrobe());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !color.trim()) return;

    const newItem: WardrobeItem = {
      id: uuidv4(),
      userId: "local-user",
      name: name.trim(),
      category,
      color: color.trim(),
      imageUrl: imageUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    setItems(updated);
    saveWardrobe(updated);

    setName("");
    setColor("");
    setImageUrl("");
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    saveWardrobe(updated);
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
      {items.length === 0 ? (
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
