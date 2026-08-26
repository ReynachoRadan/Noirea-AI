"use client";

import { WardrobeItem } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

type WardrobeCardProps = {
  item: WardrobeItem;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
};

export default function WardrobeCard({
  item,
  onEdit,
  onDelete,
}: WardrobeCardProps) {
  return (
    <div className="group relative rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="aspect-square bg-neutral-800 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-neutral-600 text-sm">No image</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate">{item.name}</p>
        <p className="text-xs text-neutral-400 capitalize">
          {item.category} · {item.color}
        </p>
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded-lg bg-black/60 p-1.5 transition hover:bg-amber-300 hover:text-black"
          title="Edit item"
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="h-4 w-4 text-white" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-lg bg-black/60 p-1.5 transition hover:bg-red-500"
          title="Hapus item"
          aria-label={`Hapus ${item.name}`}
        >
          <Trash2 className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
