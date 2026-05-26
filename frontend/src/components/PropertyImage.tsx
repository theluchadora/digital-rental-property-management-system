import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { isUsablePropertyPhotoUrl, resolvePhotoUrl } from "@/lib/property-photos";

type PropertyImageProps = {
  src: string;
  alt: string;
  className?: string;
  onFailed?: () => void;
};

/** Renders a property photo or empty state — never swaps in a placeholder image. */
export default function PropertyImage({
  src,
  alt,
  className = "",
  onFailed,
}: PropertyImageProps) {
  const [broken, setBroken] = useState(!isUsablePropertyPhotoUrl(src));

  useEffect(() => {
    setBroken(!isUsablePropertyPhotoUrl(src));
  }, [src]);

  if (broken) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/40 ${className}`}
        aria-hidden
      >
        <ImageOff className="h-5 w-5 text-muted-foreground/60" />
      </div>
    );
  }

  return (
    <img
      src={resolvePhotoUrl(src)}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => {
        setBroken(true);
        onFailed?.();
      }}
    />
  );
}
