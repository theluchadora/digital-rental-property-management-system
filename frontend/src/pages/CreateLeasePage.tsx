import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, CheckCircle, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { unitsApi } from "@/lib/api/units";
import { leasesApi } from "@/lib/api/leases";
import type { RentalUnit } from "@/types/api";

export default function CreateLeasePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [units, setUnits] = useState<RentalUnit[]>([]);
  const [unitId, setUnitId] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [leaseDoc, setLeaseDoc] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUnits() {
      try {
        const response = await unitsApi.list({ status: "VACANT" });
        setUnits(response.data.data || []);
      } catch (err) {
        console.error("Failed to load units:", err);
      }
    }
    loadUnits();
  }, []);

  const vacantUnits = units;
  const selectedUnit = units.find(u => u.id === unitId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId || !tenantEmail || !startDate || !endDate || !monthlyRent || !deposit) {
      toast({ title: "Form Incomplete", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
      const response = await leasesApi.create({
        unitId,
        tenantEmail,
        startDate,
        endDate,
        monthlyRent: Number(monthlyRent),
        depositAmount: Number(deposit),
      });

      const newLease = response.data.lease;

      if (leaseDoc) {
        await leasesApi.uploadDocument(newLease.id, leaseDoc);
      }

      toast({ title: "Lease Created", description: "The lease agreement has been created successfully." });
      navigate("/leases");
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to create lease", variant: "destructive" });
    }
  };

  const termMonths = startDate && endDate
    ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  return (
    <div>
      <button onClick={() => navigate("/leases")} className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Leases
      </button>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create New Lease</h1>
        <p className="text-sm text-muted-foreground">Draft a residential lease agreement</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Lease_Agreement_{selectedUnit?.unitIdentifier || "Unit"}.pdf</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-card border border-border p-4 md:p-10 space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">RESIDENTIAL LEASE AGREEMENT</h2>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">DIGITAL ESTATE STANDARD FORM V.2.4</p>
                    <div className="h-px bg-border mt-4" />
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This Residential Lease Agreement ("Agreement") is made and entered into this{" "}
                    {startDate ? new Date(startDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "___"},
                    by and between Digital Estate Holdings ("Landlord") and{" "}
                    {tenantEmail || "___"}{" "}
                    ("Tenant").
                  </p>

                  <div>
                    <h3 className="font-bold text-sm text-foreground">1. PROPERTY DESCRIPTION</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The Landlord hereby leases to the Tenant the following premises:{" "}
                      <strong className="text-foreground">{selectedUnit ? `${selectedUnit.unitIdentifier}, ${selectedUnit.property?.title || ""}, ${selectedUnit.property?.addressCity || ""}` : "___"}</strong>.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-foreground">2. LEASE TERM</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The term of this lease shall be for a period of <strong className="text-foreground">{termMonths || "___"} months</strong>,
                      commencing on {startDate ? new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "___"}{" "}
                      and ending on {endDate ? new Date(endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "___"}.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-foreground">3. RENT & SECURITY DEPOSIT</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tenant agrees to pay a monthly rent of <strong className="text-foreground">${monthlyRent ? Number(monthlyRent).toLocaleString() + ".00" : "___"}</strong>.
                      A security deposit of <strong className="text-foreground">${deposit ? Number(deposit).toLocaleString() + ".00" : "___"}</strong> shall
                      be held by the Landlord during the duration of the occupancy.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-foreground">4. MAINTENANCE & UTILITIES</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tenant is responsible for electric and internet services. Landlord shall provide water, sewage, and trash removal services.
                      Maintenance requests must be submitted via the Digital Estate Portal.
                    </p>
                  </div>

                  <div className="pt-8 mt-8 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm text-secondary italic">Digital Estate (E-Signed)</p>
                        <div className="h-px bg-border mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">LANDLORD SIGNATURE</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center rounded border-2 border-dashed border-border py-2 text-xs text-muted-foreground">
                          PENDING TENANT SIGNATURE
                        </div>
                        <div className="h-px bg-border mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">TENANT SIGNATURE</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Lease Terms</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Unit</Label>
                  <Select value={unitId} onValueChange={(val) => {
                    setUnitId(val);
                    const u = mockUnits.find(u => u.id === val);
                    if (u) {
                      setMonthlyRent(String(u.rentAmount));
                      setDeposit(String(u.depositAmount || u.rentAmount));
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Choose a unit" /></SelectTrigger>
                    <SelectContent>
                      {vacantUnits.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.unitIdentifier} — {u.property?.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tenant Email</Label>
                  <Input type="email" placeholder="e.g. tenant@demo.local" value={tenantEmail} onChange={e => setTenantEmail(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>

                {termMonths > 0 && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs uppercase text-muted-foreground">Lease Duration</p>
                    <p className="text-sm font-bold">{termMonths} Months</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Monthly Rent ($)</Label>
                  <Input type="number" placeholder="e.g. 3450" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Security Deposit ($)</Label>
                  <Input type="number" placeholder="e.g. 5000" value={deposit} onChange={e => setDeposit(e.target.value)} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-sm">Upload Signed Document</p>
                  <p className="text-xs text-muted-foreground">Already have a signed copy? Upload the PDF here.</p>
                </div>
                {leaseDoc ? (
                  <div className="flex items-center justify-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                    <span className="truncate">{leaseDoc.name}</span>
                    <button onClick={() => setLeaseDoc(null)}><X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Select File</Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setLeaseDoc(e.target.files?.[0] || null)}
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={handleSubmit}>
                Send to Tenant ▷
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">Finalize and dispatch document</p>
              <Button type="button" variant="outline" className="w-full" onClick={() => {
                toast({ title: "Draft Saved", description: "Lease saved as draft." });
              }}>
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
