"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BUCKET = "club-covers";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

type Props = {
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
};

export default function CoverImageUpload({ currentUrl, onUpload, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local preview URL while uploading
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview ?? currentUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected after a removal
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    // Show a local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to upload an image.");
        setPreview(null);
        return;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setError("Upload failed. Please try again.");
        setPreview(null);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      onUpload(publicUrl);
      // Keep preview shown until parent re-renders with new currentUrl
    } catch {
      setError("Something went wrong. Please try again.");
      setPreview(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onRemove();
  }

  return (
    <div className="space-y-2">
      {/* Drop zone / preview */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        className={[
          "relative w-full aspect-video rounded-lg border-2 overflow-hidden transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          uploading
            ? "cursor-wait border-border"
            : displayUrl
            ? "cursor-pointer border-border hover:border-primary/50"
            : "cursor-pointer border-dashed border-border hover:border-primary/50 bg-muted/30",
        ].join(" ")}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Club cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm">Click to upload a cover image</span>
            <span className="text-xs">JPEG, PNG, WebP or GIF — max 5 MB</span>
          </div>
        )}

        {/* Overlay while uploading */}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading…
          </div>
        )}

        {/* Hover overlay on existing image */}
        {displayUrl && !uploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex items-center gap-1.5 text-white text-sm font-medium">
              <Upload className="h-4 w-4" />
              Change image
            </div>
          </div>
        )}
      </div>

      {/* Remove button + error */}
      <div className="flex items-center justify-between gap-2">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {displayUrl && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="ml-auto text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload cover image"
      />
    </div>
  );
}
