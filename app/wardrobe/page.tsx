"use client";

import WardrobeCard from "@/components/wardrobe/wardrobecard";
import { ClothingCategory, SavedOutfit, WardrobeItem } from "@/types";
import {
  ArrowLeft,
  BookmarkCheck,
  ImagePlus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CATEGORIES: ClothingCategory[] = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "accessory",
];

const SAVED_OUTFIT_GROUPS = [
  "Casual",
  "Formal",
  "Night Out",
  "Sporty",
  "Travel",
  "Other",
] as const;

type SavedOutfitGroup = (typeof SAVED_OUTFIT_GROUPS)[number];

function classifySavedOutfit(outfit: SavedOutfit): SavedOutfitGroup {
  const text =
    `${outfit.name} ${outfit.summary} ${outfit.reasoning ?? ""}`.toLowerCase();

  if (/(formal|office|kantor|meeting|elegan|work)/.test(text)) return "Formal";
  if (/(party|date|dinner|malam|night|pesta)/.test(text)) return "Night Out";
  if (/(sport|gym|lari|run|active|olahraga)/.test(text)) return "Sporty";
  if (/(travel|vacation|liburan|beach|pantai|outdoor)/.test(text))
    return "Travel";
  if (/(casual|santai|weekend|hangout|jalan|ngopi|coffee|brunch)/.test(text))
    return "Casual";

  return "Other";
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ClothingCategory>("top");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | ClothingCategory
  >("all");
  const [color, setColor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageError, setImageError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<ClothingCategory>("top");
  const [editColor, setEditColor] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFileName, setEditImageFileName] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  useEffect(() => {
    const fetchSavedOutfits = async () => {
      try {
        const res = await fetch("/api/saved-outfits", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch saved outfits");
        setSavedOutfits(await res.json());
      } catch (error) {
        console.error("Failed to load saved outfits:", error);
      } finally {
        setIsSavedLoading(false);
      }
    };

    fetchSavedOutfits();
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
      setImageFileName("");
      setImageError("");
      setAnalysisError("");
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to add wardrobe item:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Pilih file gambar yang valid.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Ukuran gambar maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setImageUrl(reader.result);
      setImageFileName(file.name);
      setImageError("");
      setAnalysisError("");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!imageUrl.startsWith("data:image/")) {
      setAnalysisError("Upload gambar terlebih dahulu untuk dianalisis.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/wardrobe/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analisis gambar gagal");

      setName(data.name || "");
      setCategory(data.category || "top");
      setColor(data.color || "");
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Gagal menganalisis gambar. Isi detailnya secara manual.",
      );
    } finally {
      setIsAnalyzing(false);
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

  const openEdit = (item: WardrobeItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditColor(item.color);
    setEditImageUrl(item.imageUrl || "");
    setEditImageFileName("");
    setEditError("");
  };

  const closeEdit = () => {
    if (isSavingEdit) return;
    setEditingItem(null);
    setEditError("");
    if (editImageInputRef.current) editImageInputRef.current.value = "";
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Pilih file gambar yang valid.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError("Ukuran gambar maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setEditImageUrl(reader.result);
      setEditImageFileName(file.name);
      setEditError("");
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim() || !editColor.trim()) {
      setEditError("Nama dan warna wajib diisi.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");
    try {
      const res = await fetch(`/api/wardrobe/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory,
          color: editColor.trim(),
          imageUrl: editImageUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui item");

      setItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? data : item)),
      );
      setEditingItem(null);
      if (editImageInputRef.current) editImageInputRef.current.value = "";
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Gagal memperbarui item.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteSavedOutfit = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-outfits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete saved outfit");
      setSavedOutfits((prev) => prev.filter((outfit) => outfit.id !== id));
    } catch (error) {
      console.error("Failed to delete saved outfit:", error);
    }
  };

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <div className="h-screen overflow-y-auto bg-neutral-950 p-6 pb-12 text-white">
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
          value={imageUrl.startsWith("data:") ? "" : imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setImageFileName("");
          }}
          className="flex-1 min-w-[160px] bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 transition hover:border-amber-300 hover:text-white">
          <ImagePlus className="h-4 w-4" />
          {imageFileName ? "Gambar dipilih" : "Upload gambar"}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
          />
        </label>
        <button
          type="button"
          onClick={handleAnalyzeImage}
          disabled={isAnalyzing || !imageUrl.startsWith("data:image/")}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-200 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles className="h-4 w-4" />
          {isAnalyzing ? "Menganalisis..." : "Analisis AI"}
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
        >
          Tambah
        </button>
        {imageError && (
          <p className="basis-full text-xs text-red-300">{imageError}</p>
        )}
        {analysisError && (
          <p className="basis-full text-xs text-amber-200">{analysisError}</p>
        )}
        {imageFileName && (
          <p className="basis-full truncate text-xs text-neutral-500">
            File: {imageFileName}
          </p>
        )}
      </form>

      {items.length > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <label htmlFor="wardrobe-filter" className="text-sm text-neutral-400">
            Tampilkan
          </label>
          <select
            id="wardrobe-filter"
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as "all" | ClothingCategory)
            }
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm capitalize text-white outline-none focus:border-amber-300"
          >
            <option value="all">Semua item ({items.length})</option>
            {CATEGORIES.map((itemCategory) => {
              const itemCount = items.filter(
                (item) => item.category === itemCategory,
              ).length;

              return (
                <option key={itemCategory} value={itemCategory}>
                  {itemCategory} ({itemCount})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <p className="text-neutral-500 text-sm">Memuat wardrobe...</p>
      ) : items.length === 0 ? (
        <p className="text-neutral-500 text-sm">Belum ada item wardrobe.</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          Belum ada item dalam kategori {selectedCategory}.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <WardrobeCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEdit();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-wardrobe-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-900 p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Wardrobe item
                </p>
                <h2
                  id="edit-wardrobe-title"
                  className="mt-1 text-lg font-semibold text-white"
                >
                  Edit item
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                title="Tutup"
                aria-label="Tutup edit item"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm text-neutral-300">
                  Nama item
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                    required
                  />
                </label>
                <label className="space-y-1.5 text-sm text-neutral-300">
                  Kategori
                  <select
                    value={editCategory}
                    onChange={(e) =>
                      setEditCategory(e.target.value as ClothingCategory)
                    }
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm capitalize text-white outline-none focus:border-amber-300"
                  >
                    {CATEGORIES.map((itemCategory) => (
                      <option key={itemCategory} value={itemCategory}>
                        {itemCategory}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 text-sm text-neutral-300">
                Warna
                <input
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                  required
                />
              </label>

              <label className="block space-y-1.5 text-sm text-neutral-300">
                URL gambar
                <input
                  value={editImageUrl.startsWith("data:") ? "" : editImageUrl}
                  onChange={(e) => {
                    setEditImageUrl(e.target.value);
                    setEditImageFileName("");
                  }}
                  placeholder="URL gambar (opsional)"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 transition hover:border-amber-300 hover:text-white">
                  <ImagePlus className="h-4 w-4" />
                  {editImageFileName ? "Gambar dipilih" : "Ganti gambar"}
                  <input
                    ref={editImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="sr-only"
                  />
                </label>
                {editImageUrl && (
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editImageUrl}
                      alt="Preview gambar item"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {editError && <p className="text-sm text-red-300">{editError}</p>}

              <div className="flex justify-end gap-2 border-t border-neutral-800 pt-4">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingEdit ? "Menyimpan..." : "Simpan perubahan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="mt-12 border-t border-neutral-800 pt-8">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/15 text-amber-300">
            <BookmarkCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Saved Looks</h2>
            <p className="text-sm text-neutral-500">
              Outfit yang kamu simpan dari rekomendasi stylist.
            </p>
          </div>
        </div>

        {isSavedLoading ? (
          <p className="text-sm text-neutral-500">Memuat saved looks...</p>
        ) : savedOutfits.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Belum ada outfit yang disimpan dari chat.
          </p>
        ) : (
          <div className="space-y-8">
            {SAVED_OUTFIT_GROUPS.map((group) => {
              const outfits = savedOutfits.filter(
                (outfit) => classifySavedOutfit(outfit) === group,
              );

              if (outfits.length === 0) return null;

              return (
                <div key={group}>
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-neutral-400">
                    {group}
                  </h3>
                  <div className="grid gap-5 lg:grid-cols-2">
                    {outfits.map((outfit) => (
                      <article
                        key={outfit.id}
                        className="rounded-xl border border-amber-500/20 bg-neutral-900 p-4"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                              Saved outfit · {group}
                            </p>
                            <h4 className="mt-1 text-base font-semibold text-white">
                              {outfit.name}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedOutfit(outfit.id)}
                            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-red-500/10 hover:text-red-300"
                            title="Hapus saved outfit"
                            aria-label="Hapus saved outfit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {outfit.items.map((item) => (
                            <div
                              key={item.id}
                              className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
                            >
                              <div className="aspect-square bg-neutral-800">
                                {item.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-neutral-600">
                                    <Sparkles className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <p className="truncate p-2 text-[11px] text-neutral-200">
                                {item.name}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 border-t border-neutral-800 pt-3">
                          <p className="text-sm font-medium leading-relaxed text-white">
                            {outfit.summary}
                          </p>
                          {outfit.reasoning && (
                            <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                              {outfit.reasoning}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
