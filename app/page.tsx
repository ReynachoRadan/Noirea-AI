"use client";

import ChatBox from "@/components/ChatBox";
import Sidebar from "@/components/Sidebar";
import { ChatSession, Message } from "@/types";
import { useEffect, useState } from "react";

export default function Page() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const createNewSession = async () => {
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const newSession: ChatSession = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setSelectedSessionId(newSession.id);
      return newSession;
    } catch (error) {
      console.error("Failed to create session:", error);
      return null;
    }
  };

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

  const getAutoSessionTitle = (value: string) => {
    const cleanValue = value.replace(/\s+/g, " ").trim();
    return cleanValue.length > 40
      ? `${cleanValue.slice(0, 40).trim()}...`
      : cleanValue;
  };

  const handleSend = async (text: string) => {
    let targetSessionId = selectedSessionId;

    if (!targetSessionId) {
      const newSession = await createNewSession();
      if (!newSession) return;
      targetSessionId = newSession.id;
    }

    const session = sessions.find((s) => s.id === targetSessionId);
    const shouldAutoRename =
      !session ||
      (session.name === "New Chat" && session.messages.length === 0);

    if (shouldAutoRename && targetSessionId) {
      const autoTitle = getAutoSessionTitle(text);
      await handleRenameSession(targetSessionId, autoTitle);
    }

    const optimisticMessage: Message = {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: "user",
      text,
    };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? { ...s, messages: [...s.messages, optimisticMessage] }
          : s,
      ),
    );
    setSelectedSessionId(targetSessionId);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/sessions/${targetSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to send message");

      const aiMessage = await res.json();

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    type: "ai" as const,
                    text: aiMessage.text,
                    recommendation: aiMessage.recommendation,
                  },
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
    await createNewSession();
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

    const targetMessage = session.messages[index] as Message & { id?: string };
    const trimmedMessages = session.messages.slice(0, index + 1);
    trimmedMessages[index] = {
      ...trimmedMessages[index],
      text: newText,
      id: trimmedMessages[index]?.id ?? `local-${Date.now()}-${index}`,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSessionId ? { ...s, messages: trimmedMessages } : s,
      ),
    );

    if (!targetMessage?.id) {
      return;
    }

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
                  {
                    type: "ai" as const,
                    text: aiMessage.text,
                    recommendation: aiMessage.recommendation,
                  },
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
        <div className="min-h-full">
          {isFetching ? (
            <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
              Memuat percakapan...
            </div>
          ) : (
            <ChatBox
              messages={currentSession?.messages ?? []}
              onSend={handleSend}
              isLoading={isLoading}
              onEdit={handleEditMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
}
