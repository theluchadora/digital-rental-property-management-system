import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, MessageSquare, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { leasesApi } from "@/lib/api/leases";
import { openChapaCheckout, pollChapaPayment, startChapaPayment } from "@/lib/chapa-payment";
import type { Lease } from "@/types/api";

type Props = {
  lease: Lease;
  onLeaseUpdated?: (lease: Lease) => void;
  compact?: boolean;
};

const TENANT_CANCELABLE = ["INITIATED", "AWAITINGPAYMENT"] as const;

export function LeaseActionButtons({ lease, onLeaseUpdated, compact }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.role === "OWNER";
  const [loadingDecision, setLoadingDecision] = useState<"accept" | "decline" | null>(null);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const stopPollRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopPollRef.current?.(), []);

  const handleAccept = async () => {
    setLoadingDecision("accept");
    try {
      await leasesApi.decide(lease.id, true);
      const refreshed = await leasesApi.getById(lease.id);
      onLeaseUpdated?.(refreshed.data.lease);
      toast({ title: "Application accepted", description: "Invoice sent to tenant." });
    } catch {
      toast({ title: "Failed to accept", variant: "destructive" });
    } finally {
      setLoadingDecision(null);
    }
  };

  const handleDecline = async () => {
    setLoadingDecision("decline");
    try {
      await leasesApi.decide(lease.id, false);
      onLeaseUpdated?.({ ...lease, status: "TERMINATED" });
      toast({ title: "Application declined" });
    } catch {
      toast({ title: "Failed to decline", variant: "destructive" });
    } finally {
      setLoadingDecision(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await leasesApi.cancel(lease.id);
      onLeaseUpdated?.(res.data.lease);
      toast({ title: "Application cancelled" });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Could not cancel application";
      toast({ title: "Cancel failed", description: message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const handlePay = async () => {
    const invoice = lease.invoices?.find(
      (inv) => inv.status === "UNPAID" || inv.status === "OVERDUE"
    );
    if (!invoice) {
      toast({
        title: "No invoice found",
        description: "No unpaid invoice for this lease.",
        variant: "destructive",
      });
      return;
    }

    setPaying(true);
    try {
      const { checkoutUrl, txRef, testMode, testPhones } = await startChapaPayment({
        amountDue: invoice.amountDue,
        email: user?.email || "tenant@gmail.com",
        firstName: user?.firstName || "Tenant",
        lastName: user?.lastName || "User",
        phoneNumber: user?.phoneNumber,
        invoiceId: invoice.id,
      });
      openChapaCheckout(checkoutUrl, txRef, invoice.id);
      toast({
        title: "Chapa opened",
        description: testMode
          ? `Test mode: use phone ${testPhones?.[0] ?? "0900123456"} (OTP 12345).`
          : "Complete payment in the new tab.",
        duration: testMode ? 12000 : 5000,
      });

      stopPollRef.current?.();
      stopPollRef.current = pollChapaPayment(
        invoice.id,
        txRef,
        async () => {
          setPaying(false);
          toast({ title: "Payment successful" });
          const refreshed = await leasesApi.getById(lease.id);
          onLeaseUpdated?.(refreshed.data.lease);
        },
        () => setPaying(false)
      );
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (error as Error)?.message ||
        "Could not start payment";
      toast({ title: "Payment error", description: message, variant: "destructive" });
      setPaying(false);
    }
  };

  const btnSize = compact ? "sm" : "default";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-2"}`}>
      {isOwner && lease.status === "INITIATED" && (
        <>
          <Button
            size={btnSize}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={!!loadingDecision}
            onClick={handleAccept}
          >
            {loadingDecision === "accept" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Accept"
            )}
          </Button>
          <Button
            size={btnSize}
            variant="destructive"
            disabled={!!loadingDecision}
            onClick={handleDecline}
          >
            {loadingDecision === "decline" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Decline"
            )}
          </Button>
        </>
      )}

      {!isOwner && lease.status === "AWAITINGPAYMENT" && (
        <>
          <Button
            size={btnSize}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={paying || cancelling}
            onClick={handlePay}
          >
            {paying ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <CreditCard className="mr-1 h-3 w-3" />
            )}
            {paying ? "Processing..." : "Pay with Chapa"}
          </Button>
          <CancelApplicationButton
            btnSize={btnSize}
            cancelling={cancelling}
            onConfirm={handleCancel}
          />
        </>
      )}

      {!isOwner && lease.status === "INITIATED" && (
        <CancelApplicationButton
          btnSize={btnSize}
          cancelling={cancelling}
          onConfirm={handleCancel}
          label="Cancel application"
        />
      )}

      {(isOwner ? lease.tenantId : lease.ownerId) && (
        <Link to={`/messages?userId=${isOwner ? lease.tenantId : lease.ownerId}`}>
          <Button variant="outline" size={btnSize} disabled={cancelling || paying}>
            <MessageSquare className="mr-1 h-3 w-3" /> Message
          </Button>
        </Link>
      )}
    </div>
  );
}

function CancelApplicationButton({
  btnSize,
  cancelling,
  onConfirm,
  label = "Cancel",
}: {
  btnSize: "sm" | "default";
  cancelling: boolean;
  onConfirm: () => void;
  label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size={btnSize} variant="outline" disabled={cancelling}>
          {cancelling ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="mr-1 h-3 w-3" />
          )}
          {cancelling ? "Cancelling..." : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this application?</AlertDialogTitle>
          <AlertDialogDescription>
            The owner will be notified and the property will be available again. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep application</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Yes, cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
