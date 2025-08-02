// ChatBox.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/types";
import { Button } from "@/components/UI/Button";
import { TextArea } from "@/components/UI/TextArea";
import { Spinner } from "@/components/UI/Spinner";
import { motion } from "framer-motion";
import { SendHorizonal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import CodeBlock from "./CodeBlock";
import { Copy, Pencil, Save } from "lucide-react";

type ChatBoxProps = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSend: (text: string) => void;
  onEdit: (index: number, newText: string) => void;
  isLoading: boolean;
};

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <>
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
                  isUser ? "flex justify-end" : "flex justify-start"
                )}
              >
                {isUser && (
                  <div className="relative group px-5 py-3 rounded-xl max-w-[85%] text-sm shadow-sm bg-neutral-800 text-white whitespace-pre-line">
                    {editingIndex === index ? (
                      <div>
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full bg-neutral-700 text-white p-2 rounded resize-none"
                        />
                        <button
                          onClick={() => handleCopy(msg.text)}
                          className="p-1 rounded hover:bg-white/10 transition"
                        >
                          <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(index, msg.text)}
                          className="p-1 rounded hover:bg-white/10 transition"
                        >
                          <Pencil className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {msg.text}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-2">
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(msg.text)
                            }
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            Salin
                          </button>
                          <button
                            onClick={() => handleStartEdit(index, msg.text)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isAI && (
                  <div className="prose dark:prose-invert w-full max-w-3xl text-sm px-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock,
                        p: ({ children }) => (
                          <p className="mb-3 leading-relaxed">{children}</p>
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
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
