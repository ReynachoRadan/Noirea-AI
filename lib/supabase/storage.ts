import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const BUCKET = "wardrobe-images";

export class WardrobeStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WardrobeStorageError";
  }
}

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function parseImageDataUrl(value: string) {
  const match = value.match(
    /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i,
  );
  if (!match) return null;

  const contentType = match[1].toLowerCase();
  const extension = MIME_TO_EXTENSION[contentType] ?? "jpg";
  return {
    contentType,
    extension,
    buffer: Buffer.from(match[2], "base64"),
  };
}

export async function storeWardrobeImage(userId: string, imageUrl: string) {
  if (!imageUrl.startsWith("data:image/")) return imageUrl || null;

  const parsed = parseImageDataUrl(imageUrl);
  if (!parsed || parsed.buffer.length === 0) {
    throw new Error("Invalid image data URL");
  }

  const path = `${userId}/${randomUUID()}.${parsed.extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, parsed.buffer, {
      contentType: parsed.contentType,
      upsert: false,
    });

  if (error) {
    throw new WardrobeStorageError(
      `Failed to upload wardrobe image: ${error.message}`,
    );
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeWardrobeImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex === -1) return;

  const path = decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
  if (!path) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("Failed to remove wardrobe image:", error);
}
