"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  /** Called when the API returns the full asset (url, width, height, etc.). */
  onAssetUploaded?: (asset: {
    url: string;
    width?: number;
    height?: number;
    mime: string;
    size: number;
  }) => void;
  placeholder?: string;
  /** Base URL of the API server (for resolving relative upload paths). */
  apiBase?: string;
};

export function ImageUpload({
  value,
  onChange,
  onAssetUploaded,
  placeholder = "Drop image or click to upload",
  apiBase = "",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message ?? `Upload failed (${res.status})`);
        }

        const asset = await res.json();
        const url = asset.url.startsWith("/")
          ? `${apiBase}${asset.url}`
          : asset.url;

        onChange(url);
        onAssetUploaded?.({
          url,
          width: asset.width ?? undefined,
          height: asset.height ?? undefined,
          mime: asset.mime,
          size: asset.size,
        });
      } catch (err: any) {
        setError(err.message ?? "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange, onAssetUploaded, apiBase],
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Only image files are supported");
        return;
      }
      upload(file);
    },
    [upload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const hasImage = !!value && value !== "";

  return (
    <div className="space-y-1.5">
      {/* Preview / drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          "relative flex items-center justify-center rounded-md border-2 border-dashed cursor-pointer transition-colors overflow-hidden",
          "min-h-[80px]",
          dragOver
            ? "border-primary bg-primary/5"
            : hasImage
              ? "border-border hover:border-primary/50"
              : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-muted/20",
        ].join(" ")}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[10px] text-muted-foreground">Uploading...</span>
          </div>
        ) : hasImage ? (
          <div className="relative w-full group">
            <img
              src={value}
              alt=""
              className="w-full h-auto max-h-[160px] object-contain"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="p-1.5 rounded-md bg-white/90 hover:bg-white text-foreground"
                title="Replace image"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="p-1.5 rounded-md bg-white/90 hover:bg-white text-red-600"
                title="Remove image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-4 text-muted-foreground/60">
            <ImagePlus className="h-6 w-6" />
            <span className="text-[10px]">{placeholder}</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-[10px] text-red-500">{error}</p>
      )}
    </div>
  );
}
