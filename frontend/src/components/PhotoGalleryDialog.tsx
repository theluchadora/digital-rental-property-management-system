import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import PropertyImage from "@/components/PropertyImage";

interface PhotoGalleryDialogProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhotoGalleryDialog({ images, initialIndex = 0, open, onOpenChange }: PhotoGalleryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const prev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrentIndex(i => (i + 1) % images.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 bg-background border-border">
        <div className="relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1.5 text-foreground hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative flex items-center justify-center bg-muted min-h-[50vh] max-h-[80vh]">
            <PropertyImage
              src={images[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              className="max-h-[80vh] w-full object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background h-9 w-9"
                  onClick={prev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background h-9 w-9"
                  onClick={next}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          <div className="p-3 text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-3 pb-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`shrink-0 h-14 w-20 rounded-md overflow-hidden border-2 transition-colors ${
                    i === currentIndex ? "border-secondary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <PropertyImage
                    src={img}
                    alt={`Thumb ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
