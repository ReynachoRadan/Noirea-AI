"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError("Cek email kamu untuk konfirmasi akun.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium mb-6 text-center">NOIRÉA</h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 p-6 rounded-xl border border-neutral-800 bg-neutral-900"
        >
          <h2 className="text-sm font-medium mb-2">
            {mode === "login" ? "Masuk" : "Buat akun"}
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="text-xs text-neutral-400 hover:text-white transition mt-1"
          >
            {mode === "login"
              ? "Belum punya akun? Daftar"
              : "Sudah punya akun? Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}