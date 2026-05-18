import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
  triggerLabel?: string;
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
}

export default function DeleteConfirmDialog({
  title = "Are you sure?",
  description = "This action cannot be undone. This will permanently delete this item.",
  onConfirm,
  trigger,
  triggerLabel,
  triggerVariant = "outline",
  disabled = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button 
            variant={triggerVariant} 
            size="sm" 
            className={triggerVariant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "text-destructive border-destructive/30 hover:bg-destructive/10"}
            disabled={disabled}
          >
            <Trash2 className="mr-2 h-4 w-4" /> {triggerLabel || "Delete"}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}