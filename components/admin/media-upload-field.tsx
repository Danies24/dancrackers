"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

export function MediaUploadField({
  productId,
  kind,
  currentUrl,
  onUploaded,
}: {
  productId: string;
  kind: "image" | "video";
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const { show } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);

      const res = await fetch(`/api/admin/products/${productId}/media`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        show(data?.error?.message ?? "Upload failed.");
        return;
      }
      onUploaded(data.url);
      show(`${kind === "image" ? "Image" : "Video"} uploaded.`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {kind === "image" && currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="h-32 w-32 rounded-md border border-border object-cover" />
      )}
      {kind === "video" && currentUrl && (
        <video controls src={currentUrl} className="max-h-48 rounded-md border border-border" />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={kind === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm"}
        onChange={onFileChange}
        disabled={uploading}
        className="text-sm"
      />
      {uploading && <p className="text-xs text-muted">Uploading…</p>}
    </div>
  );
}
