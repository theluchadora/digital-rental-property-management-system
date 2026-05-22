import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, MessageSquare } from "lucide-react";
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

export function LeaseActionButtons({ lease, onLeaseUpdated, compact }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.role === "OWNER";
  const [loadingDecision, setLoadingDecision] = useState<"accept" | "decline" | null>(null);
  const [paying, setPaying] = useState(false);
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
            {loadingDecision === "accept" ? "..." : "Accept"}
          </Button>
          <Button
            size={btnSize}
            variant="destructive"
            disabled={!!loadingDecision}
            onClick={handleDecline}
          >
            {loadingDecision === "decline" ? "..." : "Decline"}
          </Button>
        </>
      )}

      {!isOwner && lease.status === "AWAITINGPAYMENT" && (
        <Button
          size={btnSize}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          disabled={paying}
          onClick={handlePay}
        >
          <CreditCard className="mr-1 h-3 w-3" />
          {paying ? "Processing..." : "Pay with Chapa"}
        </Button>
      )}

      {!isOwner && lease.status === "INITIATED" && (
        <span className="text-xs text-muted-foreground">Awaiting owner approval</span>
      )}

      {(isOwner ? lease.tenantId : lease.ownerId) && (
        <Link to={`/messages?userId=${isOwner ? lease.tenantId : lease.ownerId}`}>
          <Button variant="outline" size={btnSize}>
            <MessageSquare className="mr-1 h-3 w-3" /> Message
          </Button>
        </Link>
      )}
    </div>
  );
}
