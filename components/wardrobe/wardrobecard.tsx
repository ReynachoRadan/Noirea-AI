"use client";

import { WardrobeItem } from "@/types";
import { Trash2 } from "lucide-react";

type WardrobeCardProps = {
  item: WardrobeItem;
  onDelete: (id: string) => void;
};

export default function WardrobeCard({ item, onDelete }: WardrobeCardProps) {
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
      <button
        onClick={() => onDelete(item.id)}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}