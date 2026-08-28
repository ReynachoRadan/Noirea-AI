"use client";

import { Button } from "@/components/ui/Button";
import { LANGUAGE_OPTIONS, STYLE_OPTIONS, StyleProfile } from "@/types/profile";
import { ArrowLeft, Check, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const EMPTY_PROFILE: StyleProfile = {
  displayName: "",
  styles: [],
  favoriteColors: "",
  avoidColors: "",
  occasions: "",
  language: "id",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<StyleProfile>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json())
      .then(setProfile)
      .catch(() => setStatus("Profil gagal dimuat."))
      .finally(() => setIsLoading(false));
  }, []);

  const update = (field: keyof StyleProfile, value: string) =>
    setProfile((current) => ({ ...current, [field]: value }));

  const toggleStyle = (style: StyleProfile["styles"][number]) =>
    setProfile((current) => ({
      ...current,
      styles: current.styles.includes(style)
        ? current.styles.filter((item) => item !== style)
        : [...current.styles, style],
    }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan profil");
      setProfile(data);
      setStatus("Profil tersimpan.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gagal menyimpan profil.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-y-auto bg-neutral-950 px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-2xl pb-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke chat
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300/15 text-amber-300">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
              Personal style
            </p>
            <h1 className="text-2xl font-semibold">Profil gaya kamu</h1>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-400">Memuat profil...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block space-y-2 text-sm text-neutral-300">
              Nama panggilan
              <input
                value={profile.displayName}
                onChange={(event) => update("displayName", event.target.value)}
                placeholder="Contoh: Rani"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-amber-300"
              />
            </label>
            <fieldset className="space-y-3">
              <legend className="text-sm text-neutral-300">
                Gaya yang paling kamu suka
              </legend>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => {
                  const selected = profile.styles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm capitalize transition ${selected ? "border-amber-300 bg-amber-300/15 text-amber-200" : "border-neutral-700 text-neutral-400 hover:border-neutral-500"}`}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                      {style}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="block space-y-2 text-sm text-neutral-300">
              Warna favorit
              <input
                value={profile.favoriteColors}
                onChange={(event) =>
                  update("favoriteColors", event.target.value)
                }
                placeholder="Hitam, putih, navy"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-amber-300"
              />
            </label>
            <label className="block space-y-2 text-sm text-neutral-300">
              Warna yang dihindari
              <input
                value={profile.avoidColors}
                onChange={(event) => update("avoidColors", event.target.value)}
                placeholder="Warna yang jarang kamu pakai"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-amber-300"
              />
            </label>
            <label className="block space-y-2 text-sm text-neutral-300">
              Aktivitas atau occasion utama
              <textarea
                value={profile.occasions}
                onChange={(event) => update("occasions", event.target.value)}
                placeholder="Kantor, kuliah, weekend, acara malam"
                rows={3}
                className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-amber-300"
              />
            </label>
            <label className="block space-y-2 text-sm text-neutral-300">
              Bahasa rekomendasi AI
              <select
                value={profile.language}
                onChange={(event) => update("language", event.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-amber-300"
              >
                {LANGUAGE_OPTIONS.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan profil"}
              </Button>
              {status && (
                <span className="text-sm text-neutral-400">{status}</span>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
