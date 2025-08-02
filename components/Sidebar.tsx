import { ChatSession } from "@/types";
import { Trash2, MessageSquare } from "lucide-react";

type SidebarProps = {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
};
export default function Sidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: SidebarProps) {
  return (
    <div className="min-w-[240px] w-[260px] max-w-[100%] bg-white border-r border-gray-200 p-4 flex flex-col space-y-4 h-full sticky top-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
      <button
        onClick={onCreate}
        className="relative overflow-hidden w-full py-2 px-4 bg-black text-white font-semibold rounded-lg transition 
             hover:bg-gradient-to-r hover:from-black hover:to-gray-800 hover:ring-1 hover:ring-gray-300 shimmer-effect">
        + New Chat
      </button>

      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`p-3 rounded-xl border transition group 
              ${
                s.id === activeSessionId
                  ? "bg-gray-50 border-black/20"
                  : "bg-white border-gray-200 hover:bg-gray-100"
              }`}
          >
            <input
              value={s.name}
              onChange={(e) => onRename(s.id, e.target.value)}
              className="bg-transparent text-sm font-medium w-full outline-none text-black placeholder:text-gray-400"
              placeholder="Untitled"
            />

            <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
              <button
                onClick={() => onSelect(s.id)}
                className="flex items-center gap-1 hover:text-black transition"
              >
                <MessageSquare size={16} /> Open
              </button>

              <button
                onClick={() => onDelete(s.id)}
                className="flex items-center gap-1 hover:text-red-500 transition"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
