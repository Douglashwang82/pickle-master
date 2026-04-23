"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BUCKET = "session-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

type Props = {
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
};

export default function SessionImageUpload({ currentUrl, onUpload, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview ?? currentUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use JPEG, PNG, WebP, or GIF.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sign in before uploading an event image.");
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
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    }
  }

  function openPicker() {
    if (!uploading) inputRef.current?.click();
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onRemove();
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => e.key === "Enter" && openPicker()}
        className={cn(
          "relative aspect-[16/9] w-full overflow-hidden rounded-md border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          uploading && "cursor-wait border-border",
          !uploading && displayUrl && "cursor-pointer border-border hover:border-primary/50",
          !uploading && !displayUrl && "cursor-pointer border-dashed border-border bg-muted/30 hover:border-primary/50"
        )}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Session event" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm font-medium text-foreground">Add event image</span>
            <span className="text-xs">JPEG, PNG, WebP, or GIF up to 5 MB</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/75 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading...
          </div>
        )}

        {displayUrl && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors hover:bg-black/30 hover:opacity-100">
            <div className="flex items-center gap-1.5 text-sm font-medium text-white">
              <Upload className="h-4 w-4" />
              Replace image
            </div>
          </div>
        )}
      </div>

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
            <X className="mr-1 h-3.5 w-3.5" />
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
        aria-label="Upload session image"
      />
    </div>
  );
}
