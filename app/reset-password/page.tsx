"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmation) {
      setError("Konfirmasi sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Sandi berhasil diubah. Mengarahkan ke halaman masuk...");
      await supabase.auth.signOut();
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-3 p-6 rounded-xl border border-neutral-800 bg-neutral-900"
      >
        <h1 className="text-xl font-medium">Buat sandi baru</h1>
        <p className="text-xs text-neutral-400 mb-2">
          Masukkan sandi baru untuk akun NOIRÉA kamu.
        </p>
        <input
          type="password"
          placeholder="Sandi baru"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          className="bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <input
          type="password"
          placeholder="Ulangi sandi baru"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          minLength={6}
          className="bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {message && <p className="text-xs text-green-400">{message}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50"
        >
          {isLoading ? "Menyimpan..." : "Simpan sandi"}
        </button>
      </form>
    </div>
  );
}