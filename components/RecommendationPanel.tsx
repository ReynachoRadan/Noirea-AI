"use client";

import { StyleRecommendation } from "@/types";
import { LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

export default function RecommendationPanel() {
  const [prompt, setPrompt] = useState("");
  const [recommendation, setRecommendation] =
    useState<StyleRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isLoading) return;

    setError(null);
    setRecommendation(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat rekomendasi outfit");
      }

      setRecommendation(data as StyleRecommendation);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal membuat rekomendasi outfit",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="border-b border-neutral-800 bg-neutral-950 px-4 py-5 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300 text-neutral-950">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Outfit Pick</h2>
            <p className="text-xs text-neutral-500">
              Rekomendasi berdasarkan isi wardrobe kamu
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Contoh: outfit casual untuk jalan sore"
            aria-label="Permintaan rekomendasi outfit"
            className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-300"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? "Mencari..." : "Rekomendasikan"}
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded-lg border border-red-900/70 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {recommendation && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-300">
                Pilihan stylist
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {recommendation.summary}
              </h3>
              {recommendation.reasoning && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {recommendation.reasoning}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {recommendation.items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
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
                        <Sparkles className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-white">
                      {item.name}
                    </p>
                    <p className="truncate text-[11px] capitalize text-neutral-500">
                      {item.category} · {item.color}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
