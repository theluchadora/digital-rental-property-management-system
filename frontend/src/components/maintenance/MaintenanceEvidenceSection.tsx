import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { isImageEvidenceUrl } from "@/lib/maintenance-utils";

interface MaintenanceEvidenceSectionProps {
  evidenceUrls: string[];
  variant?: "card" | "detail";
}

export function MaintenanceEvidenceThumbnail({
  evidenceUrls,
  className = "w-24 h-24",
}: {
  evidenceUrls: string[];
  className?: string;
}) {
  const firstImage = evidenceUrls.find((url) => isImageEvidenceUrl(url));

  if (!firstImage) {
    return (
      <div
        className={`${className} rounded-lg bg-muted flex items-center justify-center shrink-0`}
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className={`relative ${className} rounded-lg overflow-hidden bg-muted shrink-0`}>
      <img src={firstImage} alt="Maintenance evidence" className="w-full h-full object-cover" loading="lazy" />
      {evidenceUrls.length > 1 && (
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
          +{evidenceUrls.length}
        </div>
      )}
    </div>
  );
}

export default function MaintenanceEvidenceSection({
  evidenceUrls,
  variant = "detail",
}: MaintenanceEvidenceSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const imageUrls = evidenceUrls.filter(isImageEvidenceUrl);
  const pdfUrls = evidenceUrls.filter((url) => !isImageEvidenceUrl(url));

  if (evidenceUrls.length === 0) {
    if (variant === "card") return null;
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No photos attached</p>
      </div>
    );
  }

  const nextImage = () => {
    if (imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    }
  };

  const prevImage = () => {
    if (imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  return (
    <div>
      {imageUrls.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase font-semibold text-muted-foreground">Attached photos</p>
            <p className="text-xs text-muted-foreground">{imageUrls.length} image(s)</p>
          </div>
          <div className="relative">
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden bg-muted">
              <img
                src={imageUrls[currentImageIndex]}
                alt={`Evidence ${currentImageIndex + 1}`}
                className="h-full w-full object-contain cursor-pointer"
                onClick={() => setFullscreenOpen(true)}
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </div>
                </>
              )}
            </div>
          </div>
          {imageUrls.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {imageUrls.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? "border-secondary" : "border-transparent"
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {pdfUrls.length > 0 && (
        <div className={imageUrls.length > 0 ? "mt-4" : ""}>
          <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">Documents</p>
          <ul className="space-y-2">
            {pdfUrls.map((url, idx) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-secondary hover:underline"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  Attachment {idx + 1}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          {imageUrls.length > 0 && (
            <div className="relative h-[85vh] flex items-center justify-center">
              <img
                src={imageUrls[currentImageIndex]}
                alt={`Fullscreen ${currentImageIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
