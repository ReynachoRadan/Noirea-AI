"use client";

import { getTranslation } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGE_OPTIONS, StyleProfile } from "@/types/profile";
import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [lang, setLang] = useState("id");
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase.auth]);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) return;
        const profileData = (await response.json()) as StyleProfile;
        setProfile(profileData);
        if (profileData?.language) setLang(profileData.language);
      } catch {
        // keep default language
      }
    };

    loadLanguage();
  }, []);

  const t = getTranslation(lang);

  const handleLanguageChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextLanguage = event.target.value;
    setLang(nextLanguage);
    window.dispatchEvent(
      new CustomEvent("language-change", { detail: nextLanguage }),
    );

    const nextProfile = profile ?? {
      displayName: "",
      styles: [],
      favoriteColors: "",
      avoidColors: "",
      occasions: "",
      language: nextLanguage,
    };

    setProfile({
      ...nextProfile,
      language: nextLanguage as StyleProfile["language"],
    });

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextProfile, language: nextLanguage }),
      });
    } catch {
      // keep local update if save fails
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="group relative mt-auto border-t border-gray-200 pt-4">
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-100"
        aria-label="Open account menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
          <UserRound size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-gray-800">
            {email ?? "..."}
          </span>
          <span className="block text-[11px] text-gray-500">{t.account}</span>
        </span>
        <Settings size={15} className="text-gray-400" />
      </button>

      <div className="pointer-events-none absolute bottom-full left-0 z-20 w-full translate-y-2 pb-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
          <div className="px-2 pb-2 pt-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
              {t.aiLanguage}
            </label>
            <select
              value={lang}
              onChange={handleLanguageChange}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-gray-400"
            >
              {LANGUAGE_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-100"
          >
            <Settings size={14} /> {t.profileSettings}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={14} /> {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
