import { useRef, useState } from "react";
import { Upload, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadAreaProps {
  accept?: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  onFilesSelected: (files: File[]) => void;
  compact?: boolean;
}

export default function FileUploadArea({
  accept = "image/*,.pdf",
  multiple = false,
  label = "Drag & drop or click to upload",
  sublabel = "PNG, JPG, PDF up to 10MB",
  onFilesSelected,
  compact = false,
}: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) {
      const newFiles = multiple ? [...files, ...selected] : selected;
      setFiles(newFiles);
      onFilesSelected(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesSelected(next);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-secondary/50 transition-colors text-muted-foreground ${
          compact ? "p-4" : "p-6 md:p-8"
        }`}
      >
        <Upload className={compact ? "h-5 w-5 mb-1" : "h-8 w-8 mb-3"} />
        <p className={compact ? "text-xs" : "text-sm font-medium"}>{label}</p>
        {!compact && <p className="text-xs mt-1">{sublabel}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
              <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
              <span className="truncate flex-1">{f.name}</span>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
