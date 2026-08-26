"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase.auth]);

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
          <span className="block text-[11px] text-gray-500">Account</span>
        </span>
        <Settings size={15} className="text-gray-400" />
      </button>

      <div className="pointer-events-none absolute bottom-full left-0 z-20 w-full translate-y-2 pb-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-100"
          >
            <Settings size={14} /> Profile settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
