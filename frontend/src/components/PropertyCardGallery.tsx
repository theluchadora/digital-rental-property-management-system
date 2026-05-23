import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PhotoGalleryDialog from "@/components/PhotoGalleryDialog";
import { getPropertyPhotoUrls } from "@/lib/property-photos";
import type { Property } from "@/types/api";

interface PropertyCardGalleryProps {
  property: Pick<Property, "photos" | "title">;
  className?: string;
}

export default function PropertyCardGallery({ property, className = "" }: PropertyCardGalleryProps) {
  const images = getPropertyPhotoUrls(property.photos);
  const [index, setIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className={`h-full w-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">No Image</span>
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
        <img
          src={images[index]}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
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
