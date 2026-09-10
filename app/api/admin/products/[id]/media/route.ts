import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES: Record<"image" | "video", string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm"],
};

const MAX_BYTES: Record<"image" | "video", number> = {
  image: 8 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

/** POST /api/admin/products/[id]/media. Uploads a file to Storage and returns its public URL. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const kind = formData?.get("kind");

  if (!(file instanceof File) || (kind !== "image" && kind !== "video")) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "A file and a kind of 'image' or 'video' are required." } },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES[kind].includes(file.type)) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: `Unsupported file type for ${kind}: ${file.type}` } },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES[kind]) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: `File is too large (max ${MAX_BYTES[kind] / (1024 * 1024)}MB).` } },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? (kind === "image" ? "jpg" : "mp4");
  const path = `${id}/${kind}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-media")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-media").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
