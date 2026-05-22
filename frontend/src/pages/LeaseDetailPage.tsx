import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Calendar, DollarSign, User, Building2, MessageSquare, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, formatUserName } from "@/lib/utils";
import { leasesApi } from "@/lib/api/leases";
import { LeaseActionButtons } from "@/components/LeaseActionButtons";
import type { Lease } from "@/types/api";

const statusColors: Record<string, string> = {
  INITIATED: "bg-warning/10 text-warning border-warning/30",
  AWAITINGPAYMENT: "bg-warning/10 text-warning border-warning/30",
  ACTIVE: "bg-secondary/10 text-secondary border-secondary/30",
  DRAFT: "bg-muted text-muted-foreground border-border",
  EXPIRED: "bg-destructive/10 text-destructive border-destructive/30",
  TERMINATED: "bg-foreground/10 text-foreground border-foreground/30",
};

const invoiceStatusColors: Record<string, string> = {
  OVERDUE: "bg-destructive/10 text-destructive",
  PENDING_REVIEW: "bg-warning/10 text-warning",
  PAID: "bg-success/10 text-success",
  UNPAID: "bg-muted text-muted-foreground",
};

export default function LeaseDetailPage() {
  const { leaseId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLease() {
      if (!leaseId) return;
      try {
        const response = await leasesApi.getById(leaseId);
        setLease(response.data.lease);
      } catch (err) {
        console.error("Failed to load lease:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLease();
  }, [leaseId]);

  const leaseInvoices = lease?.invoices || [];

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading lease details...</div>;
  }

  if (!lease) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Lease not found.</p>
        <Link to="/leases" className="text-secondary hover:underline">Back to Leases</Link>
      </div>
    );
  }

  const monthsDiff = Math.max(
    1,
    Math.round((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
  const isOwner = user?.role === "OWNER";

  const handleUpload = async () => {
    if (!documentFile) {
      toast({ title: "No file selected", description: "Please select a PDF file to upload.", variant: "destructive" });
      return;
    }
    try {
      const response = await leasesApi.uploadDocument(lease.id, documentFile);
      setLease(response.data.lease);
      toast({ title: "Upload complete", description: "Lease document has been successfully uploaded." });
      setDocumentFile(null);
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  return (
    <div>
      <Link to="/leases" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Leases
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">#{lease.id.slice(0, 8).toUpperCase()}</h1>
            <Badge className={statusColors[lease.status]}>{lease.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{monthsDiff} month lease • Created {formatDate(lease.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LeaseActionButtons lease={lease} onLeaseUpdated={setLease} />
          {lease.documents && lease.documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await leasesApi.downloadDocument(lease.documents![0].id, `lease_${lease.id.slice(0, 8)}.pdf`);
                  toast({ title: "Lease Document Downloaded" });
                } catch {
                  toast({ title: "Download failed", variant: "destructive" });
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Calendar, label: "Start Date", value: formatDate(lease.startDate, { month: "short", day: "2-digit", year: "numeric" }) },
              { icon: Calendar, label: "End Date", value: formatDate(lease.endDate, { month: "short", day: "2-digit", year: "numeric" }) },
              { icon: DollarSign, label: "Monthly Rent", value: formatCurrency(lease.monthlyRent) },
              { icon: DollarSign, label: "Deposit", value: formatCurrency(lease.depositAmount) },
            ].map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <stat.icon className="h-5 w-5 text-secondary mb-2" />
                  <span className="text-[10px] uppercase text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-bold mt-1">{stat.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Tenant Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {lease.tenant?.firstName?.[0] || "?"}{lease.tenant?.lastName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-semibold">{formatUserName(lease.tenant)}</p>
                    <p className="text-sm text-muted-foreground">{lease.tenant?.email}</p>
                  </div>
                </div>
                {lease.tenantId && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary" onClick={() => navigate(`/messages?userId=${lease.tenantId}`)}>
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Unit Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Unit", value: lease.unit?.unitIdentifier || "—" },
                  { label: "Configuration", value: `${lease.unit?.bedrooms || 0} BD / ${lease.unit?.bathrooms || 0} BA` },
                  { label: "Property", value: lease.unit?.property?.title || "—" },
                  { label: "City", value: lease.unit?.property?.addressCity || "—" },
                ].map((item, index) => (
                  <div key={index}>
                    <p className="text-[10px] uppercase text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {leaseInvoices.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="p-4 font-medium">Invoice</th>
                      <th className="p-4 font-medium">Billing Month</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Due Date</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaseInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="p-4 font-medium">{invoice.id.slice(0, 8).toUpperCase()}</td>
                        <td className="p-4">{formatDate(invoice.billingMonth, { month: "long", year: "numeric" })}</td>
                        <td className="p-4 font-medium">{formatCurrency(invoice.amountDue)}</td>
                        <td className="p-4">{formatDate(invoice.dueDate)}</td>
                        <td className="p-4"><Badge className={`text-[10px] ${invoiceStatusColors[invoice.status]}`}>{invoice.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">No invoices for this lease yet.</div>
              )}
            </CardContent>
          </Card>

          {lease.status === "TERMINATED" && (
            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="text-destructive">Termination Details</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terminated At</span>
                  <span className="font-medium">{formatDate(lease.terminatedAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium">{lease.terminationReason || "—"}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Lease Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total Contract Value", value: formatCurrency(lease.monthlyRent * monthsDiff) },
                { label: "Monthly Obligation", value: formatCurrency(lease.monthlyRent) },
                { label: "Security Held", value: formatCurrency(lease.depositAmount) },
                { label: "Term Length", value: `${monthsDiff} months` },
                { label: "Invoices Issued", value: `${leaseInvoices.length}` },
              ].map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lease.documents && lease.documents.length > 0 ? (
                lease.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-secondary" />
                      <span className="text-sm">{document.documentType}</span>
                    </div>
                    <button
                      className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Download document"
                      onClick={async () => {
                        try {
                          await leasesApi.downloadDocument(document.id, `${document.documentType}_${document.id.slice(0, 6)}.pdf`);
                          toast({ title: "Document Downloaded" });
                        } catch {
                          toast({ title: "Download failed", variant: "destructive" });
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No signed lease documents uploaded yet.
                </div>
              )}

              {isOwner && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Upload Signed Lease PDF</p>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} 
                    className="block w-full text-sm" 
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={!documentFile} 
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}