import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ChevronLeft, ChevronRight, Eye, Bell, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { chapaApi } from "@/lib/api/chapa";
import type { Invoice } from "@/types/api";

const statusColors: Record<string, string> = {
  OVERDUE: "bg-destructive/10 text-destructive",
  PAID: "bg-success/10 text-success",
  UNPAID: "bg-muted text-muted-foreground",
};

const MOCK_INVOICES: Invoice[] = [
  { id: "inv-test001", billingMonth: "2024-05-01", dueDate: "2024-05-15", amountDue: 15000, status: "UNPAID", leaseId: "lease-001", receipts: [] },
  { id: "inv-test002", billingMonth: "2024-06-01", dueDate: "2024-06-15", amountDue: 15000, status: "UNPAID", leaseId: "lease-001", receipts: [] },
  { id: "inv-test003", billingMonth: "2024-04-01", dueDate: "2024-04-15", amountDue: 15000, status: "OVERDUE", leaseId: "lease-001", receipts: [] },
  { id: "inv-test004", billingMonth: "2024-03-01", dueDate: "2024-03-15", amountDue: 15000, status: "PAID", leaseId: "lease-001", receipts: [] },
  { id: "inv-test005", billingMonth: "2024-02-01", dueDate: "2024-02-15", amountDue: 15000, status: "PAID", leaseId: "lease-001", receipts: [] },
];

const ITEMS_PER_PAGE = 5;

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.role === "OWNER";
  
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const loadInvoices = () => {
    if (statusFilter === "all") {
      setInvoices(MOCK_INVOICES);
    } else {
      setInvoices(MOCK_INVOICES.filter(inv => inv.status.toLowerCase() === statusFilter.toLowerCase()));
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  
const handlePayWithChapa = async (invoice: Invoice) => {
  try {
    const response = await chapaApi.initializePayment({
      amount: invoice.amountDue.toFixed(2),
      email: user?.email || 'tenant@example.com',
      first_name: user?.firstName || 'Tenant',
      last_name: user?.lastName || 'User',
    });

    if (response.checkout_url) {
      // Save tx_ref
      localStorage.setItem(`paying_invoice_${invoice.id}`, response.tx_ref);
      
      // Open Chapa in NEW TAB
      window.open(response.checkout_url, '_blank');
      
      toast({
        title: "Chapa opened in new tab",
        description: "Complete payment, then come back here.",
      });
      
      // Start checking payment status
      checkPaymentLoop(invoice.id, response.tx_ref);
    }
  } catch (error) {
    toast({ title: "Error", description: "Payment failed", variant: "destructive" });
  }
};

// Keep checking until paid
const checkPaymentLoop = async (invoiceId: string, txRef: string) => {
  const check = async () => {
    try {
      const result = await chapaApi.verifyTransaction(txRef);
      
      if (result.status === 'success') {
        // Update invoice
        setInvoices(prev => prev.map(inv => 
          inv.id === invoiceId ? { ...inv, status: "PAID" as const } : inv
        ));
        localStorage.removeItem(`paying_invoice_${invoiceId}`);
        toast({ title: "Payment Successful! ✅" });
        return; // Stop checking
      }
      
      // Check again in 5 seconds
      setTimeout(check, 5000);
    } catch (error) {
      setTimeout(check, 5000);
    }
  };
  
  check();
};

  // ✅ CHECK PAYMENT STATUS ON RETURN
  useEffect(() => {
    const checkReturningPayments = async () => {
      for (const inv of MOCK_INVOICES) {
        const txRef = localStorage.getItem(`paying_invoice_${inv.id}`);
        if (txRef && inv.status !== 'PAID') {
          try {
            const result = await chapaApi.verifyTransaction(txRef);
            if (result.status === 'success') {
              MOCK_INVOICES.forEach(i => {
                if (i.id === inv.id) i.status = "PAID";
              });
              setInvoices([...MOCK_INVOICES]);
              localStorage.removeItem(`paying_invoice_${inv.id}`);
              toast({ title: "Payment Successful! ✅", description: `${inv.id} is now PAID.` });
            }
          } catch (e) {
            // Keep waiting
          }
        }
      }
    };
    
    checkReturningPayments();
  }, []);

  const filteredInvoices = invoices;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const unpaidCount = MOCK_INVOICES.filter(i => i.status === "UNPAID").length;
  const overdueCount = MOCK_INVOICES.filter(i => i.status === "OVERDUE").length;
  const paidCount = MOCK_INVOICES.filter(i => i.status === "PAID").length;
  const totalCount = MOCK_INVOICES.length;
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
            <span className="ml-2 text-yellow-500 font-semibold">🧪 TEST MODE</span>
          </p>
        </div>
        {isOwner && (
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-3 w-3" /> EXPORT
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">UNPAID</p><p className="text-2xl font-bold">{unpaidCount}</p></CardContent></Card>
        <Card className="bg-destructive/5 border-destructive/20"><CardContent className="p-4"><p className="text-xs uppercase text-destructive">OVERDUE</p><p className="text-2xl font-bold text-destructive">{overdueCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">PAID</p><p className="text-2xl font-bold text-success">{paidCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">COLLECTION RATE</p><p className="text-2xl font-bold text-secondary">{collectionRate}%</p></CardContent></Card>
      </div>

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
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
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
                    <td className="p-4 font-medium">{inv.amountDue.toLocaleString()} ETB</td>
                    <td className="p-4">{new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</td>
                    <td className="p-4"><Badge className={statusColors[inv.status]}>{inv.status}</Badge></td>
                    <td className="p-4">
                      {(inv.status === "UNPAID" || inv.status === "OVERDUE") && !isOwner ? (
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handlePayWithChapa(inv)}>
                          Pay with Chapa
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs">Showing {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} of {filteredInvoices.length}</p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button key={page} size="icon" className={`h-8 w-8 ${page === currentPage ? "bg-secondary text-secondary-foreground" : ""}`} variant={page === currentPage ? "default" : "outline"} onClick={() => setCurrentPage(page)}>{page}</Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}