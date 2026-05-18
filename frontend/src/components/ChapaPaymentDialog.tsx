import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { chapaApi } from "@/lib/api/chapa";
import type { Invoice } from "@/types/api";

interface ChapaPaymentDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ChapaPaymentDialog({ 
  invoice, 
  open, 
  onOpenChange, 
  onSuccess 
}: ChapaPaymentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handlePayNow = async () => {
    try {
      setLoading(true);
      
      console.log("🔵 Starting payment for invoice:", invoice.id);
      
      const response = await chapaApi.initializePayment({
        amount: invoice.amountDue.toFixed(2),
        email: user?.email || 'tenant@example.com',
        first_name: user?.firstName || 'Tenant',
        last_name: user?.lastName || 'User',
        phone_number: phoneNumber || '0911111111',
      });

      console.log("🟢 Backend response:", response);

      if (response.status === 'success' && response.data?.checkout_url) {
        toast({
          title: "Redirecting...",
          description: "Taking you to Chapa payment page",
        });
        
        // Redirect to Chapa checkout
        window.location.href = response.data.checkout_url;
      } else {
        toast({
          title: "Error",
          description: "Could not initialize payment",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("🔴 Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if returning from Chapa
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status === 'success' && open) {
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
      
      toast({
        title: "Payment Successful! ✅",
        description: `Invoice ${invoice.id.replace("inv-", "INV-").toUpperCase()} has been paid.`,
      });
      
      onSuccess();
      onOpenChange(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay with Chapa</DialogTitle>
          <DialogDescription>
            Complete your payment securely
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {invoice.id.replace("inv-", "INV-").toUpperCase()}
            </p>
            <p className="text-3xl font-bold mt-1">
              {invoice.amountDue.toLocaleString()} ETB
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Due: {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            <Label>Phone Number (optional)</Label>
            <Input
              placeholder="0912345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">You can pay with:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>📱 TeleBirr</span>
              <span>📱 CBE Birr</span>
              <span>🏦 Bank Transfer</span>
              <span>💳 Credit/Debit Card</span>
            </div>
          </div>

          <Button
            onClick={handlePayNow}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={loading}
            size="lg"
          >
            {loading ? "Processing..." : `Pay ${invoice.amountDue.toLocaleString()} ETB`}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            You will be redirected to Chapa's secure payment page
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}