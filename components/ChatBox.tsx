// ChatBox.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TextArea } from "@/components/ui/TextArea";
import { Message } from "@/types";
import clsx from "clsx";
import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Save,
  SendHorizonal,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatBoxProps = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSend: (text: string) => void;
  onEdit: (index: number, newText: string) => void;
  isLoading: boolean;
};

const welcomeMessages = [
  "Can I help you find the perfect outfit?",
  "Need a fresh look for today? I can help.",
  "Tell me your vibe, and I'll match it to your wardrobe.",
  "Want outfit inspiration that fits your style?",
  "I can help you build a look from what you already own.",
];

export default function ChatBox({
  messages,
  onSend,
  setMessages,
  isLoading,
  onEdit,
}: ChatBoxProps) {
  const [text, setText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState("");
  const [savedOutfits, setSavedOutfits] = useState<Set<string>>(new Set());
  const [savingOutfit, setSavingOutfit] = useState<string | null>(null);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [typedWelcome, setTypedWelcome] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (editingIndex !== null) {
      onEdit(editingIndex, text.trim());
      setEditingIndex(null);
      setEditedText("");
    } else {
      onSend(text.trim());
    }

    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!text.trim()) return;

      if (editingIndex !== null) {
        onEdit(editingIndex, text.trim());
        setEditingIndex(null);
        setEditedText("");
      } else {
        onSend(text.trim());
      }

      setText("");
    }
  };

  const handleStartEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditedText(text);
    setText(text); //← isi kembali text input
  };
  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      onEdit(editingIndex, editedText);
      setEditingIndex(null);
      setText(""); // Kosongkan text input jika sebelumnya isi hasil edit
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isEmpty = messages.length === 0;

  useEffect(() => {
    if (!isEmpty) return;

    const currentPhrase = welcomeMessages[welcomeIndex];
    let charIndex = 0;
    setTypedWelcome("");

    const intervalId = setInterval(() => {
      charIndex += 1;
      setTypedWelcome(currentPhrase.slice(0, charIndex));

      if (charIndex >= currentPhrase.length) {
        clearInterval(intervalId);
      }
    }, 45);

    const timeoutId = window.setTimeout(
      () => {
        setWelcomeIndex((prev) => (prev + 1) % welcomeMessages.length);
      },
      currentPhrase.length * 45 + 1200,
    );

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isEmpty, welcomeIndex]);

  const saveOutfit = async (
    messageKey: string,
    recommendation: NonNullable<Message["recommendation"]>,
  ) => {
    if (savedOutfits.has(messageKey) || savingOutfit === messageKey) return;

    setSavingOutfit(messageKey);
    try {
      const response = await fetch("/api/saved-outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recommendation.summary,
          summary: recommendation.summary,
          reasoning: recommendation.reasoning,
          itemIds: recommendation.items.map((item) => item.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to save outfit");
      setSavedOutfits((prev) => new Set(prev).add(messageKey));
    } catch (error) {
      console.error("Failed to save outfit:", error);
    } finally {
      setSavingOutfit(null);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <>
      {isEmpty && (
        <div className="flex h-[calc(100vh-96px)] items-center justify-center px-6 pb-10">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-700 bg-neutral-900/85 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/15">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">
                NOIRÉA
              </span>
            </div>

            <div className="mt-5 min-h-[72px]">
              <p className="text-2xl font-medium leading-relaxed text-white sm:text-3xl">
                {typedWelcome}
                <span className="ml-1 inline-block h-6 w-[2px] animate-pulse bg-white align-middle sm:h-7" />
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-neutral-400">
              Tell me your mood, occasion, or the look you want to pull
              together.
            </p>
          </div>
        </div>
      )}

      {/* CHAT MESSAGES */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-6">
          <div className="flex justify-center pb-2">
            <h1 className="font-jakarta font-medium text-lg text-neutral-800 dark:text-neutral-100">
              NOIRÉA
            </h1>
          </div>

          {messages.map((msg, index) => {
            const isUser = msg.type === "user";
            const isAI = msg.type === "ai";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  "w-full",
                  isUser ? "flex justify-end" : "flex justify-start",
                )}
              >
                {isUser && (
                  <div className="relative group max-w-[85%] rounded-xl bg-neutral-800 px-4 py-3 text-sm text-white shadow-sm whitespace-pre-line">
                    {editingIndex === index ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full resize-none rounded-lg border border-neutral-600 bg-neutral-700 p-2 text-sm text-white outline-none"
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleSaveEdit}
                            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-white transition hover:bg-white/20"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="pr-14">{msg.text}</div>
                        <div className="mt-2 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(msg.text)
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-neutral-900/80 text-neutral-300 transition hover:bg-white/10 hover:text-white"
                            title="Salin"
                            aria-label="Salin pesan"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M9 9.5A2.5 2.5 0 0 1 11.5 7h6A2.5 2.5 0 0 1 20 9.5v6A2.5 2.5 0 0 1 17.5 18h-6A2.5 2.5 0 0 1 9 15.5v-6Z" />
                              <path d="M15 7V5.5A2.5 2.5 0 0 0 12.5 3h-6A2.5 2.5 0 0 0 4 5.5v6A2.5 2.5 0 0 0 6.5 14H9" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleStartEdit(index, msg.text)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-neutral-900/80 text-neutral-300 transition hover:bg-white/10 hover:text-white"
                            title="Edit"
                            aria-label="Edit pesan"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isAI && (
                  <div className="w-full max-w-3xl space-y-3 px-2">
                    {msg.recommendation && (
                      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)] ring-1 ring-white/5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/15 text-amber-300">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                                Outfit Recommendation
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              saveOutfit(`outfit-${index}`, msg.recommendation!)
                            }
                            disabled={
                              savedOutfits.has(`outfit-${index}`) ||
                              savingOutfit === `outfit-${index}`
                            }
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-neutral-200 transition hover:border-amber-300/50 hover:text-white"
                          >
                            {savedOutfits.has(`outfit-${index}`) ? (
                              <>
                                <BookmarkCheck className="h-3.5 w-3.5 text-amber-300" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-3.5 w-3.5" />
                                {savingOutfit === `outfit-${index}`
                                  ? "Saving..."
                                  : "Save outfit"}
                              </>
                            )}
                          </button>
                        </div>

                        <h3 className="text-base font-semibold leading-snug text-white">
                          {msg.recommendation.summary}
                        </h3>
                        {msg.recommendation.reasoning && (
                          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                            {msg.recommendation.reasoning}
                          </p>
                        )}
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {msg.recommendation.items.map((item) => (
                            <div
                              key={item.id}
                              className="overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950 shadow-sm"
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
                                  <div className="flex h-full items-center justify-center text-neutral-500">
                                    <span className="text-xs">No image</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-0.5 p-2.5">
                                <p className="truncate text-xs font-medium text-white">
                                  {item.name}
                                </p>
                                <p className="truncate text-[10px] capitalize text-neutral-400">
                                  {item.category} · {item.color}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="prose dark:prose-invert w-full text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: ({ children, ...props }) => (
                            <code
                              className="bg-neutral-200 dark:bg-neutral-800 rounded px-1 py-0.5 text-sm"
                              {...props}
                            >
                              {children}
                            </code>
                          ),
                          p: ({ children }) => (
                            <p className="mb-3 leading-relaxed">{children}</p>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="mr-auto bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-5 py-3 rounded-2xl text-sm flex items-center gap-2 max-w-[85%] border border-neutral-300 dark:border-neutral-700"
            >
              <Spinner className="w-4 h-4 text-neutral-500 animate-spin" />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Typing...
              </span>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* INPUT AREA (Always sticky at bottom) */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 flex gap-2 border-t border-neutral-300 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-md p-4 z-10"
      >
        <TextArea
          placeholder="Ask me anything..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          style={{ maxHeight: "120px" }}
          className="flex-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none"
        />
        <Button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="border border-neutral-400 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-2 
        hover:bg-neutral-800 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900
        disabled:opacity-50 rounded-xl transition duration-300"
        >
          <SendHorizonal className="w-5 h-5" />
        </Button>
      </form>
    </>
  );
}
