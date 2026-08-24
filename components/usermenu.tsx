"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 truncate" title={email ?? ""}>
        {email ?? "..."}
      </span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition shrink-0"
      >
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}