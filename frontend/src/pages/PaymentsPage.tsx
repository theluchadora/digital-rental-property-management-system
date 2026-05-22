import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { chapaApi } from "@/lib/api/chapa";
import { invoicesApi } from "@/lib/api/invoices";
import { openChapaCheckout, pollChapaPayment, startChapaPayment } from "@/lib/chapa-payment";
import { StatsGridSkeleton, TableSkeleton } from "@/components/ui/loading-state";
import type { Invoice } from "@/types/api";

const statusColors: Record<string, string> = {
  OVERDUE: "bg-destructive/10 text-destructive",
  PAID: "bg-success/10 text-success",
  UNPAID: "bg-muted text-muted-foreground",
};

const ITEMS_PER_PAGE = 5;

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwner = user?.role === "OWNER";
  const stopPollRef = useRef<(() => void) | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        const response = await invoicesApi.list({
          status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
        });
        setInvoices(response.data.data || []);
      } catch (err) {
        console.error("Failed to load invoices:", err);
        toast({ title: "Failed to load invoices", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoices();
  }, [statusFilter, toast]);

  const handlePaymentSuccess = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "PAID" as const } : inv))
    );
    setPayingInvoiceId(null);
    toast({ title: "Payment successful" });
  };

  const startPaymentPolling = (invoiceId: string, txRef: string) => {
    stopPollRef.current?.();
    stopPollRef.current = pollChapaPayment(
      invoiceId,
      txRef,
      () => handlePaymentSuccess(invoiceId),
      () => {
        setPayingInvoiceId(null);
        toast({
          title: "Payment not confirmed yet",
          description: "Complete payment in Chapa or try again later.",
          variant: "destructive",
        });
      }
    );
  };

  const handlePayWithChapa = async (invoice: Invoice) => {
    setPayingInvoiceId(invoice.id);
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
          ? `Test mode: use phone ${testPhones?.[0] ?? "0900123456"} and OTP 12345 if asked. Other numbers will fail.`
          : "Complete payment in the new tab. This page will update when paid.",
        duration: testMode ? 12000 : 5000,
      });
      startPaymentPolling(invoice.id, txRef);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (error as Error)?.message ||
        "Payment failed";
      toast({ title: "Payment failed", description: message, variant: "destructive" });
      setPayingInvoiceId(null);
    }
  };

  useEffect(() => {
    const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");
    const invoiceId = searchParams.get("invoice_id");
    const returnStatus = searchParams.get("status");
    if (searchParams.get("chapa_return") && txRef && invoiceId) {
      if (returnStatus === "failed" || returnStatus === "cancelled") {
        toast({
          title: "Payment not completed",
          description:
            "In Chapa test mode use phone 0900123456 (OTP 12345). Any other number fails.",
          variant: "destructive",
        });
      } else {
        startPaymentPolling(invoiceId, txRef);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const checkReturningPayments = async () => {
      for (const inv of invoices) {
        const txRef = localStorage.getItem(`paying_invoice_${inv.id}`);
        if (txRef && inv.status !== "PAID") {
          try {
            const result = await chapaApi.verifyTransaction(txRef, inv.id);
            if (result.status === "success") {
              handlePaymentSuccess(inv.id);
            }
          } catch {
            // still pending
          }
        }
      }
    };
    checkReturningPayments();
  }, [invoices]);

  useEffect(() => () => stopPollRef.current?.(), []);

  const filteredInvoices = invoices;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const unpaidCount = invoices.filter((i) => i.status === "UNPAID").length;
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const totalCount = invoices.length;
  const collectionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase">
            {isOwner ? "Owner Payments" : "My Payments"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isOwner ? "PAYMENT OVERVIEW" : "YOUR INVOICES"}
          </p>
        </div>
        {isOwner && (
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-3 w-3" /> EXPORT
          </Button>
        )}
      </div>

      {!isOwner && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Chapa test mode:</strong> On the checkout page use phone{" "}
            <code className="text-secondary">0900123456</code>, <code className="text-secondary">0900112233</code>, or{" "}
            <code className="text-secondary">0900881111</code>. If prompted for OTP, enter <code className="text-secondary">12345</code>.
            Other phone numbers will show &quot;payment failed&quot;.
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">UNPAID</p><p className="text-2xl font-bold">{unpaidCount}</p></CardContent></Card>
        <Card className="bg-destructive/5 border-destructive/20"><CardContent className="p-4"><p className="text-xs uppercase text-destructive">OVERDUE</p><p className="text-2xl font-bold text-destructive">{overdueCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">PAID</p><p className="text-2xl font-bold text-success">{paidCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">COLLECTION RATE</p><p className="text-2xl font-bold text-secondary">{collectionRate}%</p></CardContent></Card>
      </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-sm uppercase">Invoices</CardTitle>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="p-4">Invoice</th><th className="p-4">Billing Month</th><th className="p-4">Amount</th><th className="p-4">Due Date</th><th className="p-4">Status</th><th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/50">
                    <td className="p-4 font-medium">{inv.id.replace("inv-", "INV-").toUpperCase()}</td>
                    <td className="p-4">{new Date(inv.billingMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</td>
                    <td className="p-4 font-medium">{Number(inv.amountDue).toLocaleString()} ETB</td>
                    <td className="p-4">{new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</td>
                    <td className="p-4"><Badge className={statusColors[inv.status]}>{inv.status}</Badge></td>
                    <td className="p-4">
                      {(inv.status === "UNPAID" || inv.status === "OVERDUE") && !isOwner ? (
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handlePayWithChapa(inv)} disabled={payingInvoiceId === inv.id}>
                          {payingInvoiceId === inv.id ? "PROCESSING..." : "Pay with Chapa"}
                        </Button>
                      ) : inv.status === "PAID" ? (
                        <span className="text-success text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Paid</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs">Showing {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} of {filteredInvoices.length}</p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button key={page} size="icon" className={`h-8 w-8 ${page === currentPage ? "bg-secondary text-secondary-foreground" : ""}`} variant={page === currentPage ? "default" : "outline"} onClick={() => setCurrentPage(page)}>{page}</Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
