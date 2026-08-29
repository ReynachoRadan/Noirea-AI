"use client";

import WardrobeCard from "@/components/wardrobe/wardrobecard";
import { getTranslation } from "@/lib/i18n";
import { StyleProfile } from "@/types/profile";
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
  const [lang, setLang] = useState("id");
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
    const loadLanguage = async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) return;
        const profileData = (await response.json()) as StyleProfile;
        if (profileData?.language) setLang(profileData.language);
      } catch {
        // ignore
      }
    };

    loadLanguage();
  }, []);

  useEffect(() => {
    const handleLanguageEvent = (event: Event) => {
      const nextLanguage = (event as CustomEvent<string>).detail;
      if (nextLanguage) setLang(nextLanguage);
    };

    window.addEventListener("language-change", handleLanguageEvent);
    return () => window.removeEventListener("language-change", handleLanguageEvent);
  }, []);

  const t = getTranslation(lang);
  const wardrobeIntroMap: Record<string, string> = {
    id: "Kelola item favoritmu, pantau wardrobe, dan temukan kombinasi yang sesuai dengan gaya serta kegiatan harian.",
    en: "Manage your favorite pieces, track your wardrobe, and discover combinations that match your style and daily plans.",
    es: "Gestiona tus prendas favoritas, lleva un control de tu guardarropa y descubre combinaciones que se adapten a tu estilo y tus actividades diarias.",
    zh: "管理你最喜欢的单品，跟踪你的衣柜，并发现适合你风格和日常安排的搭配组合。",
    hi: "अपने पसंदीदा आइटम प्रबंधित करें, अपने वार्डरोब को ट्रैक करें और ऐसे कॉम्बिनेशन खोजें जो आपके स्टाइल और दैनिक कार्यक्रम से मेल खाते हों।",
    ar: "أدر قطعك المفضلة، وتتبع خزانة ملابسك، واكتشف تركيبات تناسب أسلوبك وخططك اليومية.",
    pt: "Gerencie suas peças favoritas, acompanhe seu guarda-roupa e descubra combinações que combinem com seu estilo e rotina diária.",
    fr: "Gérez vos pièces préférées, suivez votre garde-robe et découvrez des combinaisons qui correspondent à votre style et à votre routine quotidienne.",
    de: "Verwalte deine Lieblingsstücke, behalte deinen Kleiderschrank im Blick und entdecke Kombinationen, die zu deinem Stil und deinen täglichen Aktivitäten passen.",
    ja: "お気に入りのアイテムを管理し、ワードローブを把握し、あなたのスタイルや日常に合うコーディネートを見つけましょう。",
    ko: "좋아하는 아이템을 관리하고 옷장을 정리하며, 스타일과 일상에 맞는 조합을 찾아보세요.",
  };
  const wardrobeIntro = wardrobeIntroMap[lang] ?? wardrobeIntroMap.en;

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
      setImageError(lang === "id" ? "Pilih file gambar yang valid." : "Please choose a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError(lang === "id" ? "Ukuran gambar maksimal 5 MB." : "Maximum image size is 5 MB.");
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
      setAnalysisError(
        lang === "id"
          ? "Upload gambar terlebih dahulu untuk dianalisis."
          : "Upload an image before analyzing it.",
      );
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
        <ArrowLeft size={16} /> {t.backToChat}
      </Link>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-medium">{t.wardrobeTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
            {wardrobeIntro}
          </p>
        </div>

        <div className="flex items-center justify-end">
          <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
            {t.wardrobe}
          </p>
        </div>
      </div>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl border border-neutral-800 bg-neutral-900"
      >
        <input
          placeholder={t.itemNamePlaceholder}
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
              {c === "top" ? t.top : c === "bottom" ? t.bottom : c === "outerwear" ? t.outerwear : c === "shoes" ? t.shoes : t.accessory}
            </option>
          ))}
        </select>
        <input
          placeholder={t.colorPlaceholder}
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-28 bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <input
          placeholder={t.imageUrlPlaceholder}
          value={imageUrl.startsWith("data:") ? "" : imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setImageFileName("");
          }}
          className="flex-1 min-w-[160px] bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 transition hover:border-amber-300 hover:text-white">
          <ImagePlus className="h-4 w-4" />
          {imageFileName ? t.imageSelected : t.uploadImage}
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
          {isAnalyzing ? t.analyzing : t.analyzeAi}
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
        >
          {t.add}
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
            {t.show}
          </label>
          <select
            id="wardrobe-filter"
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as "all" | ClothingCategory)
            }
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm capitalize text-white outline-none focus:border-amber-300"
          >
            <option value="all">
              {t.allItems} ({items.length})
            </option>
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
        <p className="text-neutral-500 text-sm">{t.loadingWardrobe}</p>
      ) : items.length === 0 ? (
        <p className="text-neutral-500 text-sm">{t.noWardrobeItems}</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          {t.noCategoryItems} {selectedCategory}
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
                  {t.editItem}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                title={t.cancel}
                aria-label={t.cancel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm text-neutral-300">
                  {t.itemNamePlaceholder}
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                    required
                  />
                </label>
                <label className="space-y-1.5 text-sm text-neutral-300">
                  {t.categoryLabel}
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
                {t.colorPlaceholder}
                <input
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                  required
                />
              </label>

              <label className="block space-y-1.5 text-sm text-neutral-300">
                {t.imageUrlPlaceholder}
                <input
                  value={editImageUrl.startsWith("data:") ? "" : editImageUrl}
                  onChange={(e) => {
                    setEditImageUrl(e.target.value);
                    setEditImageFileName("");
                  }}
                  placeholder={t.imageUrlPlaceholder}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 transition hover:border-amber-300 hover:text-white">
                  <ImagePlus className="h-4 w-4" />
                  {editImageFileName ? t.imageSelected : t.uploadImage}
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
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingEdit ? t.savingProfile : t.saveChanges}
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
