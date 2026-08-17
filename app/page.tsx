"use client";

import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";
import Sidebar from "@/components/Sidebar";
import { Message, ChatSession } from "@/types";

export default function Page() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data: ChatSession[] = await res.json();
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentSession = () =>
    sessions.find((s) => s.id === selectedSessionId);

  const handleSend = async (text: string) => {
    if (!selectedSessionId) return;

    const session = sessions.find((s) => s.id === selectedSessionId);

    // Auto-generate judul dari pesan pertama, kalau nama masih default
    if (
      session &&
      session.name === "New Chat" &&
      session.messages.length === 0
    ) {
      const autoTitle =
        text.length > 40 ? text.slice(0, 40).trim() + "..." : text;
      handleRenameSession(selectedSessionId, autoTitle);
    }

    // Optimistic update: tampilkan pesan user duluan sebelum AI balas
    const optimisticMessage: Message = { type: "user", text };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSessionId
          ? { ...s, messages: [...s.messages, optimisticMessage] }
          : s,
      ),
    );
    setIsLoading(true);

    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to send message");

      const aiMessage = await res.json();

      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { type: "ai" as const, text: aiMessage.text },
                ],
              }
            : s,
        ),
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const newSession: ChatSession = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setSelectedSessionId(newSession.id);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      if (selectedSessionId === id) {
        setSelectedSessionId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleRenameSession = async (id: string, name: string) => {
    // Optimistic update dulu, biar input terasa responsif saat diketik
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));

    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename session");
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  const handleEditMessage = async (index: number, newText: string) => {
    if (!selectedSessionId) return;
    const session = sessions.find((s) => s.id === selectedSessionId);
    if (!session) return;

    // Perlu message id asli dari database — messages di state React
    // sudah termasuk field 'id' karena datang langsung dari API (lihat catatan di bawah)
    const targetMessage = session.messages[index] as Message & { id?: string };
    if (!targetMessage?.id) {
      console.error("Message id not found, cannot edit");
      return;
    }

    const trimmedMessages = session.messages.slice(0, index + 1);
    trimmedMessages[index] = { ...trimmedMessages[index], text: newText };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSessionId ? { ...s, messages: trimmedMessages } : s,
      ),
    );
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/sessions/${selectedSessionId}/messages/${targetMessage.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newText }),
        },
      );
      if (!res.ok) throw new Error("Failed to edit message");

      const aiMessage = await res.json();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId
            ? {
                ...s,
                messages: [
                  ...trimmedMessages,
                  { type: "ai" as const, text: aiMessage.text },
                ],
              }
            : s,
        ),
      );
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-white overflow-hidden">
      <aside className="w-[260px] h-full overflow-y-auto border-r border-neutral-800 bg-neutral-900 shrink-0">
        <Sidebar
          sessions={sessions}
          activeSessionId={selectedSessionId || ""}
          onSelect={(id) => setSelectedSessionId(id)}
          onCreate={handleCreateSession}
          onDelete={handleDeleteSession}
          onRename={handleRenameSession}
        />
      </aside>

      <main className="flex-1 h-full w-full overflow-y-auto">
        {isFetching ? (
          <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
            Memuat percakapan...
          </div>
        ) : currentSession ? (
          <ChatBox
            messages={currentSession?.messages ?? []}
            setMessages={() => {}}
            onSend={handleSend}
            isLoading={isLoading}
            onEdit={handleEditMessage}
          />
        ) : (
          <div className="flex-1 h-full overflow-y-auto flex items-center justify-center text-neutral-500 text-sm">
            No session selected.
          </div>
        )}
      </main>
    </div>
  );
}
