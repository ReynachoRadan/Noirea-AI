"use client";

import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";
import Sidebar from "@/components/Sidebar";
import { Message, ChatSession } from "@/types";
import { askGroq } from "@/lib/groq";
import { loadSessions, saveSessions } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export default function Page() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const saved = loadSessions();
    setSessions(saved);
    if (saved.length > 0) {
      setSelectedSessionId(saved[0].id);
    }
  }, []);

  const getCurrentSession = () =>
    sessions.find((s) => s.id === selectedSessionId);

  const handleSend = async (text: string) => {
    if (!selectedSessionId) return;

    const updatedSessions = sessions.map((session) => {
      if (session.id === selectedSessionId) {
        const updatedMessages = [
          ...session.messages,
          { type: "user" as const, text },
        ];
        return { ...session, messages: updatedMessages };
      }
      return session;
    });

    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setIsLoading(true);

    try {
      const reply = await askGroq(text);

      const updatedWithAI = updatedSessions.map((session) => {
        if (session.id === selectedSessionId) {
          const updatedMessages = [
            ...session.messages,
            { type: "ai" as const, text: reply },
          ];
          return { ...session, messages: updatedMessages };
        }
        return session;
      });

      setSessions(updatedWithAI);
      saveSessions(updatedWithAI);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      name: "New Chat",
      messages: [],
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setSelectedSessionId(newSession.id);
    saveSessions(updated);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    if (selectedSessionId === id) {
      setSelectedSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleRenameSession = (id: string, name: string) => {
    const updated = sessions.map((s) => (s.id === id ? { ...s, name } : s));
    setSessions(updated);
    saveSessions(updated);
  };
  const handleEditMessage = async (index: number, newText: string) => {
    if (!selectedSessionId) return;

    const session = sessions.find((s) => s.id === selectedSessionId);
    if (!session) return;

    // Update teks pesan yang diedit, buang semua pesan setelahnya (termasuk respons AI lama)
    const trimmedMessages = session.messages.slice(0, index + 1);
    trimmedMessages[index] = { ...trimmedMessages[index], text: newText };

    const updatedSessions = sessions.map((s) =>
      s.id === selectedSessionId ? { ...s, messages: trimmedMessages } : s,
    );
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setIsLoading(true);

    try {
      const reply = await askGroq(newText);
      const finalMessages = [
        ...trimmedMessages,
        { type: "ai" as const, text: reply },
      ];
      const finalSessions = updatedSessions.map((s) =>
        s.id === selectedSessionId ? { ...s, messages: finalMessages } : s,
      );
      setSessions(finalSessions);
      saveSessions(finalSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-white overflow-hidden">
      {/* Sidebar */}
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

      {/* Chat Area */}
      <main className="flex-1 h-full w-full overflow-y-auto">
        {currentSession ? (
          <ChatBox
            messages={currentSession?.messages ?? []}
            setMessages={(newMsgsOrFn) => {
              const currentMessages =
                typeof newMsgsOrFn === "function"
                  ? newMsgsOrFn(currentSession?.messages ?? [])
                  : newMsgsOrFn;

              const updatedSessions = sessions.map((session) =>
                session.id === selectedSessionId
                  ? { ...session, messages: currentMessages }
                  : session,
              );
              setSessions(updatedSessions);
              saveSessions(updatedSessions);
            }}
            onSend={handleSend}
            isLoading={isLoading}
            onEdit={handleEditMessage}
          />
        ) : (
          <div className="flex-1 h-full overflow-y-auto">
            No session selected.
          </div>
        )}
      </main>
    </div>
  );
}
