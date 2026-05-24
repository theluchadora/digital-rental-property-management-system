import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, Upload, Filter, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import FileUploadArea from "@/components/FileUploadArea";
import { maintenanceApi } from "@/lib/api/maintenance";
import { PageLoader, StatsGridSkeleton } from "@/components/ui/loading-state";
import type { MaintenanceRequest } from "@/types/api";
import { formatMaintenancePropertyLabel, mapMaintenanceRequest, type MappedMaintenanceRequest } from "@/lib/maintenance-utils";
import MaintenanceEvidenceSection, { MaintenanceEvidenceThumbnail } from "@/components/maintenance/MaintenanceEvidenceSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const priorityColors: Record<string, string> = {
  URGENT: "bg-destructive text-destructive-foreground",
  HIGH: "bg-warning text-warning-foreground",
  MEDIUM: "bg-secondary/10 text-secondary",
  LOW: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-muted text-foreground",
  IN_PROGRESS: "bg-secondary/10 text-secondary",
  RESOLVED: "bg-success/10 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  OWNER_REJECTED: "bg-destructive/10 text-destructive",
  CLOSED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

type ExtendedMaintenanceRequest = MappedMaintenanceRequest & {
  rejectionReason?: string;
};

export default function OwnerMaintenance() {
  const { toast } = useToast();
  const [category, setCategory] = useState("PLUMBING");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [requests, setRequests] = useState<ExtendedMaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const res = await maintenanceApi.list();
      const mapped: ExtendedMaintenanceRequest[] = (res.data.data || []).map((req: MaintenanceRequest) =>
        mapMaintenanceRequest(req)
      );
      setRequests(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const [selectedRequest, setSelectedRequest] = useState<ExtendedMaintenanceRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [resolveFiles, setResolveFiles] = useState<File[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [detailLoading, setDetailLoading] = useState(false);

  const getTitle = (desc: string) => {
    const dotIdx = desc.indexOf(".");
    return dotIdx > 0 && dotIdx < 60 ? desc.slice(0, dotIdx) : desc.slice(0, 40);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const updateStatus = (id: string, status: MaintenanceRequest["status"], note?: string, rejectionReason?: string) => {
    setRequests(prev => prev.map(r => 
      r.id === id ? { 
        ...r, 
        status, 
        note: note || r.note,
        rejectionReason: rejectionReason || (status === "REJECTED" ? rejectReason : undefined),
        updatedAt: new Date().toISOString(), 
        ...(status === "RESOLVED" ? { resolvedAt: new Date().toISOString() } : {})
      } : r
    ));
  };

  const handleAccept = async (req: ExtendedMaintenanceRequest) => {
    try {
      await maintenanceApi.updateStatus(req.id, { status: "IN_PROGRESS" });
      toast({ 
        title: "Request Accepted", 
        description: `${req.title || getTitle(req.description)} is now in progress.`,
      });
      loadRequests();
      setDetailOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to accept request", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      toast({ 
        title: "Reason Required", 
        description: "Please provide a reason for rejecting this request.",
        variant: "destructive" 
      });
      return;
    }
    try {
      await maintenanceApi.updateStatus(selectedRequest.id, { status: "OWNER_REJECTED", note: rejectReason });
      toast({ 
        title: "Request Rejected", 
        description: `${selectedRequest.title || getTitle(selectedRequest.description)} has been rejected.`,
        variant: "destructive"
      });
      loadRequests();
      setRejectOpen(false);
      setRejectReason("");
      setDetailOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to reject request", variant: "destructive" });
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest) return;
    if (!resolveNote.trim()) {
      toast({ 
        title: "Resolution Notes Required", 
        description: "Please provide resolution notes before marking as resolved.",
        variant: "destructive" 
      });
      return;
    }
    try {
      await maintenanceApi.updateStatus(selectedRequest.id, { status: "RESOLVED", note: resolveNote });
      toast({ 
        title: "Request Resolved", 
        description: `${selectedRequest.title || getTitle(selectedRequest.description)} marked as resolved. Waiting for tenant confirmation.`,
      });
      loadRequests();
      setResolveOpen(false);
      setResolveNote("");
      setResolveFiles([]);
      setDetailOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to resolve request", variant: "destructive" });
    }
  };

  const openDetail = async (req: ExtendedMaintenanceRequest) => {
    setSelectedRequest(req);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const { data } = await maintenanceApi.getById(req.id);
      if (data.request) {
        setSelectedRequest(mapMaintenanceRequest(data.request));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== "ALL" && req.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && req.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    open: requests.filter(r => r.status === "OPEN").length,
    inProgress: requests.filter(r => r.status === "IN_PROGRESS").length,
    resolved: requests.filter(r => r.status === "RESOLVED").length,
    rejected: requests.filter(r => r.status === "REJECTED").length,
    closed: requests.filter(r => r.status === "CLOSED").length,
  };

  if (isLoading) {
    return (
      <div>
        <StatsGridSkeleton count={5} />
        <div className="mt-6">
          <PageLoader label="Loading maintenance requests..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Maintenance Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Monitor active interventions and coordinate structural upkeep across all properties.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-2xl font-bold text-foreground">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-secondary">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-success">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Closed</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.closed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg md:text-xl font-bold">Maintenance Requests</h2>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No maintenance requests found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((req) => (
                  <Card 
                    key={req.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => openDetail(req)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <MaintenanceEvidenceThumbnail evidenceUrls={req.evidenceUrls} />
                        
                        {/* Content - takes full remaining width */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[10px] ${priorityColors[req.priority]}`}>{req.priority}</Badge>
                              <Badge className={`text-[10px] ${statusColors[req.status]}`}>
                                {req.status.replace("_", " ")}
                              </Badge>
                            </div>
                            {/* Status indicator - inline with badges */}
                            {req.status === "IN_PROGRESS" && (
                              <span className="flex items-center gap-1 text-xs text-secondary">
                                <Clock className="h-3 w-3" /> IN PROGRESS
                              </span>
                            )}
                            {req.status === "RESOLVED" && (
                              <span className="flex items-center gap-1 text-xs text-success">
                                <CheckCircle className="h-3 w-3" /> AWAITING APPROVAL
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-foreground text-base mt-2">
                            {req.title || truncateText(req.description, 50)}
                          </h3>
                          
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {truncateText(req.detailedDescription || req.description, 120)}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 flex-wrap">
                            <span>📍 {formatMaintenancePropertyLabel(req)}</span>
                            <span>👤 {req.tenant?.firstName} {req.tenant?.lastName}</span>
                            <span className="uppercase text-[10px]">Category: {req.category}</span>
                            <span>📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                            {req.evidenceUrls && req.evidenceUrls.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" /> {req.evidenceUrls.length} photo(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))
            )}
          </div>
        </div>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-semibold text-foreground">📸 Review Evidence</p>
              <p className="text-xs text-muted-foreground mt-1">Always check attached photos before making a decision.</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">⚡ Priority Response</p>
              <p className="text-xs text-muted-foreground mt-1">
                • Urgent: Respond within 24 hours<br />
                • High: Respond within 48 hours<br />
                • Standard: 3-5 business days
              </p>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">📝 Resolution Notes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Include detailed notes when resolving - tenants will see these.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog - Full featured */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.title || (selectedRequest ? truncateText(selectedRequest.description, 50) : "")}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              {detailLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading request details...</div>
              ) : (
              <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={priorityColors[selectedRequest.priority]}>{selectedRequest.priority}</Badge>
                <Badge className={statusColors[selectedRequest.status]}>
                  {selectedRequest.status.replace("_", " ")}
                </Badge>
              </div>

              <MaintenanceEvidenceSection evidenceUrls={selectedRequest.evidenceUrls} />
              
              {/* Description */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs uppercase font-semibold text-muted-foreground">Description</p>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedRequest.detailedDescription || selectedRequest.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Property</p>
                  <p className="font-medium">{formatMaintenancePropertyLabel(selectedRequest)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Tenant</p>
                  <p className="font-medium">{selectedRequest.tenant?.firstName} {selectedRequest.tenant?.lastName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedRequest.category}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Submitted</p>
                  <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedRequest.resolvedAt && (
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Resolved</p>
                    <p className="font-medium">{new Date(selectedRequest.resolvedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {selectedRequest.status === "REJECTED" && selectedRequest.rejectionReason && (
                <Card className="bg-destructive/10 border-destructive/20">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase text-destructive mb-1">Rejection Reason</p>
                    <p className="text-sm text-foreground">{selectedRequest.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Resolution Note */}
              {selectedRequest.note && selectedRequest.status !== "REJECTED" && (
                <Card className="bg-success/10 border-success/20">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase text-success mb-1">Resolution Note</p>
                    <p className="text-sm text-foreground">{selectedRequest.note}</p>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-muted-foreground">Request Timeline</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Request Submitted</p>
                      <p className="text-xs text-muted-foreground">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedRequest.status === "REJECTED" && (
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Request Rejected</p>
                        <p className="text-xs text-muted-foreground">{selectedRequest.rejectionReason || "No reason provided"}</p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.status !== "OPEN" && selectedRequest.status !== "REJECTED" && (
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-secondary mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Owner Responded</p>
                        <p className="text-xs text-muted-foreground">
                          Request {selectedRequest.status === "IN_PROGRESS" ? "accepted and in progress" : selectedRequest.status.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.resolvedAt && (
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-success mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Issue Resolved</p>
                        <p className="text-xs text-muted-foreground">{new Date(selectedRequest.resolvedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.status === "CLOSED" && (
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Request Closed</p>
                        <p className="text-xs text-muted-foreground">Closed by tenant on {new Date(selectedRequest.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedRequest.status === "OPEN" && (
                  <>
                    <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handleAccept(selectedRequest)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Accept
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => setRejectOpen(true)}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {selectedRequest.status === "IN_PROGRESS" && (
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setResolveOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> Mark as Resolved
                  </Button>
                )}
                {selectedRequest.status === "RESOLVED" && (
                  <div className="w-full bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                    <p className="text-sm text-success">⏳ Waiting for tenant to accept resolution</p>
                  </div>
                )}
                {selectedRequest.status === "CLOSED" && (
                  <div className="w-full bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">✓ Request closed by tenant</p>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this request. This will be visible to the tenant.</p>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Rejection Reason *</label>
              <Textarea className="mt-1" rows={4} placeholder="Explain why this request is being rejected..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleReject}>Reject Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Resolution Notes *</label>
              <Textarea className="mt-1" rows={4} placeholder="Describe what was done to resolve the issue..." value={resolveNote} onChange={e => setResolveNote(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Upload Proof of Resolution (Optional)</label>
              <div className="mt-2">
                <FileUploadArea accept="image/*,.pdf" multiple label="Upload photos or documents" onFilesSelected={setResolveFiles} compact />
              </div>
            </div>
            <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={handleResolve}>Mark as Resolved</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}