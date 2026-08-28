"use client";

import { WardrobeItem } from "@/types";
import {
  ArrowLeft,
  Bookmark,
  Check,
  LoaderCircle,
  Shirt,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const MAX_SELECTED_ITEMS = 5;

export default function MixMatchPage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [occasion, setOccasion] = useState("casual sehari-hari");
  const [result, setResult] = useState<{
    summary: string;
    reasoning: string;
    items: WardrobeItem[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch("/api/wardrobe", { cache: "no-store" });
        if (!response.ok) throw new Error("Gagal memuat wardrobe");
        setItems(await response.json());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat wardrobe",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  const toggleItem = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id))
        return current.filter((itemId) => itemId !== id);
      if (current.length >= MAX_SELECTED_ITEMS) return current;
      return [...current, id];
    });
    setError("");
  };

  const handleMatch = async () => {
    if (selectedIds.length < 2 || isMatching) {
      if (selectedIds.length < 2) {
        setError("Pilih minimal 2 item untuk membuat kombinasi outfit.");
      }
      return;
    }

    setIsMatching(true);
    setError("");
    setSaveMessage("");
    setResult(null);
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    const itemList = selectedItems
      .map((item) => `${item.name} (${item.category}, ${item.color})`)
      .join(", ");

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          prompt: `Mix & Match item berikut untuk ${occasion.trim() || "casual sehari-hari"}. Hanya gunakan item yang saya pilih: ${itemList}`,
          itemIds: selectedIds,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Gagal menilai kombinasi");
      if (
        typeof data.summary !== "string" ||
        !Array.isArray(data.items) ||
        data.items.length === 0
      ) {
        throw new Error("Respons rekomendasi tidak memiliki hasil outfit.");
      }
      setResult(data);
      setIsResultOpen(true);
    } catch (matchError) {
      setError(
        matchError instanceof Error
          ? matchError.message
          : "Gagal menilai kombinasi outfit",
      );
    } finally {
      setIsMatching(false);
    }
  };

  const handleSave = async () => {
    if (!result || isSaving) return;

    setIsSaving(true);
    setError("");
    setSaveMessage("");
    try {
      const response = await fetch("/api/saved-outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: `Mix & Match · ${occasion.trim() || "Daily look"}`,
          summary: result.summary,
          reasoning: result.reasoning,
          itemIds: result.items.map((item) => item.id),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan outfit");
      setSaveMessage("Outfit tersimpan di Saved Looks.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Gagal menyimpan outfit",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-400 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Chat
        </Link>

        <header className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            Mix & Match
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Susun kombinasi dari wardrobe kamu.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Pilih 2 sampai 5 item, lalu biarkan stylist mengecek kecocokan
            warna, proporsi, dan suasananya.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-200">
                Pilih item
              </h2>
              <span className="text-xs text-neutral-500">
                {selectedIds.length}/{MAX_SELECTED_ITEMS} dipilih
              </span>
            </div>

            {isLoading ? (
              <p className="text-sm text-neutral-500">Memuat wardrobe...</p>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
                <Shirt className="mx-auto mb-3 h-6 w-6 text-neutral-600" />
                <p className="text-sm text-neutral-400">
                  Tambahkan item wardrobe terlebih dahulu.
                </p>
                <Link
                  href="/wardrobe"
                  className="mt-4 inline-block text-sm text-amber-300 hover:text-amber-200"
                >
                  Buka Wardrobe
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`overflow-hidden rounded-xl border text-left transition ${
                        isSelected
                          ? "border-amber-300 bg-amber-300/10"
                          : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
                      }`}
                    >
                      <div className="relative aspect-square bg-neutral-800">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-600">
                            <Shirt className="h-7 w-7" />
                          </div>
                        )}
                        {isSelected && (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-neutral-950">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-white">
                          {item.name}
                        </p>
                        <p className="mt-1 truncate text-xs capitalize text-neutral-500">
                          {item.category} · {item.color}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-xl border border-neutral-800 bg-neutral-900 p-5 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold">Styling brief</h2>
            <label className="mt-5 block text-sm text-neutral-300">
              Occasion atau mood
              <input
                value={occasion}
                onChange={(event) => setOccasion(event.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                placeholder="Contoh: dinner santai"
              />
            </label>
            <button
              type="button"
              onClick={handleMatch}
              disabled={selectedIds.length < 2 || isMatching}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isMatching ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isMatching ? "Menilai kombinasi..." : "Cek kombinasi"}
            </button>
            {selectedIds.length < 2 && (
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                Pilih setidaknya 2 item di sebelah kiri untuk mengaktifkan
                rekomendasi.
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm leading-relaxed text-red-300">
                {error}
              </p>
            )}
          </aside>
        </div>

        {result && isResultOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsResultOpen(false);
            }}
          >
            <section
              className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-amber-300/30 bg-neutral-900 p-5 shadow-2xl sm:p-7"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mix-match-result-title"
            >
              <div className="flex items-start justify-between gap-5 border-b border-neutral-800 pb-6">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                    Hasil stylist
                  </p>
                  <h2
                    id="mix-match-result-title"
                    className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl"
                  >
                    {result.summary}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-neutral-300">
                    {result.reasoning}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResultOpen(false)}
                  className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                  title="Tutup hasil analisis"
                  aria-label="Tutup hasil analisis"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    Item dalam kombinasi
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {result.items.map((item) => (
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
                              <Shirt className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="mt-1 truncate text-xs capitalize text-neutral-500">
                            {item.category} · {item.color}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
                  <h3 className="text-base font-semibold text-white">
                    Mengapa ini bekerja?
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">
                    Stylist memilih item yang paling relevan dengan occasion “
                    {occasion || "daily look"}”. Perhatikan hubungan antara
                    kategori, warna, dan tingkat formalitas setiap item saat
                    mencobanya.
                    {result.items.length < selectedIds.length &&
                      " Beberapa item tidak dimasukkan karena kombinasi akan lebih seimbang tanpa item tersebut."}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      [
                        "Warna",
                        "Palet outfit terasa lebih terarah dan tidak saling bertabrakan.",
                      ],
                      [
                        "Proporsi",
                        "Kategori utama dipadukan agar siluet terlihat seimbang.",
                      ],
                      [
                        "Occasion",
                        `Dipilih untuk suasana ${occasion || "yang kamu minta"}.`,
                      ],
                    ].map(([label, description]) => (
                      <div
                        key={label}
                        className="border-l-2 border-amber-300 pl-3"
                      >
                        <p className="text-sm font-medium text-amber-200">
                          {label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          {description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-neutral-800 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsResultOpen(false)}
                  className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                >
                  Edit pilihan
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || saveMessage !== ""}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isSaving
                    ? "Menyimpan..."
                    : saveMessage
                      ? "Tersimpan"
                      : "Save outfit"}
                </button>
              </div>
              {saveMessage && (
                <p className="mt-4 text-sm text-emerald-300">{saveMessage}</p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
