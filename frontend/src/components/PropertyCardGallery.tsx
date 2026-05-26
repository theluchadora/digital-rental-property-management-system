import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import PhotoGalleryDialog from "@/components/PhotoGalleryDialog";
import PropertyImage from "@/components/PropertyImage";
import { getPropertyPhotoUrls } from "@/lib/property-photos";
import type { Property } from "@/types/api";

interface PropertyCardGalleryProps {
  property: Pick<Property, "photos" | "title">;
  className?: string;
}

export default function PropertyCardGallery({
  property,
  className = "",
}: PropertyCardGalleryProps) {
  const images = getPropertyPhotoUrls(property.photos);
  const [index, setIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  if (images.length === 0 || failed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-border bg-muted/40 ${className}`}
        aria-label="No photos available"
      >
        <ImageOff className="h-6 w-6 text-muted-foreground/70" />
        <span className="text-xs text-muted-foreground">No photo</span>
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  const openGallery = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryOpen(true);
  };

  return (
    <>
      <div
        className={`relative h-full w-full cursor-pointer group/gallery ${className}`}
        onClick={openGallery}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setGalleryOpen(true)}
      >
        <PropertyImage
          src={images[index]}
          alt={property.title}
          className="h-full w-full object-cover transition-transform group-hover/gallery:scale-105"
          onFailed={() => setFailed(true)}
        />
        {images.length > 1 && !failed && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity hover:bg-background group-hover/gallery:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity hover:bg-background group-hover/gallery:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <PhotoGalleryDialog
        images={images}
        initialIndex={index}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </>
  );
}
