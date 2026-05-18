import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { propertyImages } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, Plus, AlertCircle, FileText, X, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import FileUploadArea from "@/components/FileUploadArea";
import { maintenanceApi } from "@/lib/api/maintenance";
import { unitsApi } from "@/lib/api/units";
import type { MaintenanceRequest, MaintenanceEvidence, RentalUnit } from "@/types/api";

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
  CLOSED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

interface ExtendedMaintenanceRequest extends MaintenanceRequest {
  title?: string;
  detailedDescription?: string;
  evidenceFiles?: File[];
  evidenceUrls?: string[];
}

export default function TenantMaintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState("PLUMBING");
  const [priority, setPriority] = useState("MEDIUM");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [requests, setRequests] = useState<ExtendedMaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const res = await maintenanceApi.list();
      const mapped: ExtendedMaintenanceRequest[] = (res.data.data || []).map((req: MaintenanceRequest) => ({
        ...req,
        title: (req as unknown as Record<string, unknown>).title as string || req.description?.split(".")[0] || "Maintenance Issue",
        detailedDescription: req.description,
        evidenceUrls: (req.evidence || []).map((ev: MaintenanceEvidence) => maintenanceApi.getEvidenceDownloadUrl(ev.id)),
      }));
      setRequests(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [availableUnits, setAvailableUnits] = useState<RentalUnit[]>([]);

  const loadUnits = async () => {
    try {
      const res = await unitsApi.list();
      setAvailableUnits(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();
    loadUnits();
  }, []);

  const [selectedRequest, setSelectedRequest] = useState<ExtendedMaintenanceRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [requestToCancel, setRequestToCancel] = useState<ExtendedMaintenanceRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<ExtendedMaintenanceRequest | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageOpen, setFullscreenImageOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    unit: "",
    category: "PLUMBING",
    priority: "MEDIUM",
    title: "",
    description: "",
  });

  // Filter requests for current tenant
  const tenantRequests = requests.filter(req => req.tenant?.id === user?.id);

  const truncateText = (text: string, maxLength: number = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleFileSelect = (files: File[]) => {
    setEvidenceFiles(files);
    // Create preview URLs for images
    const previews = files.map(file => URL.createObjectURL(file));
    setEvidencePreviews(previews);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = evidenceFiles.filter((_, i) => i !== index);
    const newPreviews = evidencePreviews.filter((_, i) => i !== index);
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(evidencePreviews[index]);
    setEvidenceFiles(newFiles);
    setEvidencePreviews(newPreviews);
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.title || !newRequest.description || !newRequest.unit) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all required fields (title, description, and unit).",
        variant: "destructive" 
      });
      return;
    }

    try {
      const res = await maintenanceApi.create({
        unitId: newRequest.unit,
        category: newRequest.category,
        priority: newRequest.priority as MaintenanceRequest["priority"],
        description: `${newRequest.title}. ${newRequest.description}`,
      });

      const newId = res.data.request?.id;

      if (evidenceFiles.length > 0 && newId) {
        for (const file of evidenceFiles) {
          try {
            await maintenanceApi.uploadEvidence(newId, file);
          } catch (err) {
            console.error("Failed to upload evidence:", err);
          }
        }
      }

      toast({ 
        title: "Request Submitted", 
        description: "Your maintenance request has been logged.",
      });

      loadRequests();
      setShowNewRequestForm(false);
      setNewRequest({
        unit: "",
        category: "PLUMBING",
        priority: "MEDIUM",
        title: "",
        description: "",
      });
      evidencePreviews.forEach(preview => URL.revokeObjectURL(preview));
      setEvidenceFiles([]);
      setEvidencePreviews([]);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to submit request", variant: "destructive" });
    }
  };

  const handleCancelRequest = () => {
    if (!requestToCancel) return;
    
    // Update the request status to CANCELLED
    setRequests(prev => prev.map(r => 
      r.id === requestToCancel.id 
        ? { 
            ...r, 
            status: "CANCELLED" as MaintenanceRequest["status"], 
            note: cancelReason || "Cancelled by tenant",
            updatedAt: new Date().toISOString()
          } 
        : r
    ));
    
    toast({ 
      title: "Request Cancelled", 
      description: "Your maintenance request has been cancelled successfully.",
    });
    
    setCancelDialogOpen(false);
    setCancelReason("");
    setRequestToCancel(null);
    setDetailOpen(false);
  };

  const handleDeleteRequest = () => {
    if (!requestToDelete) return;
    
    // Completely remove the request from the list
    setRequests(prev => prev.filter(r => r.id !== requestToDelete.id));
    
    toast({ 
      title: "Request Deleted", 
      description: "Your maintenance request has been permanently deleted.",
    });
    
    setDeleteDialogOpen(false);
    setRequestToDelete(null);
    setDetailOpen(false);
  };

  const handleCancelOrDelete = (req: ExtendedMaintenanceRequest) => {
    if (req.status === "CANCELLED" || req.status === "CLOSED") {
      // If cancelled or closed, delete directly
      setRequestToDelete(req);
      setDeleteDialogOpen(true);
    } else {
      // If not cancelled, ask to cancel first
      setRequestToCancel(req);
      setCancelDialogOpen(true);
    }
  };

  const handleTenantApprove = (req: ExtendedMaintenanceRequest) => {
    toast({ 
      title: "Resolution Accepted", 
      description: "Thank you for confirming the issue is resolved. The request will be closed.",
    });
    updateStatus(req.id, "CLOSED");
    setDetailOpen(false);
  };

  const updateStatus = (id: string, status: MaintenanceRequest["status"]) => {
    setRequests(prev => prev.map(r => 
      r.id === id ? { ...r, status } : r
    ));
  };

  const openDetail = (req: ExtendedMaintenanceRequest) => {
    setSelectedRequest(req);
    setCurrentImageIndex(0);
    setDetailOpen(true);
  };

  const openFullscreenImage = (index: number) => {
    setCurrentImageIndex(index);
    setFullscreenImageOpen(true);
  };

  const nextImage = () => {
    if (selectedRequest?.evidenceUrls && selectedRequest.evidenceUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedRequest.evidenceUrls!.length);
    }
  };

  const prevImage = () => {
    if (selectedRequest?.evidenceUrls && selectedRequest.evidenceUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedRequest.evidenceUrls!.length) % selectedRequest.evidenceUrls!.length);
    }
  };

  const stats = {
    open: tenantRequests.filter(r => r.status === "OPEN").length,
    inProgress: tenantRequests.filter(r => r.status === "IN_PROGRESS").length,
    resolved: tenantRequests.filter(r => r.status === "RESOLVED").length,
    cancelled: tenantRequests.filter(r => r.status === "CANCELLED").length,
    closed: tenantRequests.filter(r => r.status === "CLOSED").length,
  };

  // Check if request is deletable (cancelled or closed)
  const isDeletable = (status: string) => {
    return status === "CANCELLED" || status === "CLOSED";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Maintenance Requests</h1>
        <p className="text-sm text-muted-foreground">
          Submit and track maintenance requests for your unit. We'll keep you updated on the progress.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-6">
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
            <p className="text-xs text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.cancelled}</p>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg md:text-xl font-bold">Your Requests</h2>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => setShowNewRequestForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </div>

          <div className="space-y-4">
            {tenantRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No maintenance requests yet.</p>
                  <Button 
                    variant="link" 
                    onClick={() => setShowNewRequestForm(true)}
                    className="mt-2"
                  >
                    Create your first request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              tenantRequests.map((req, idx) => {
                const firstImage = req.evidenceUrls && req.evidenceUrls.length > 0 
                  ? req.evidenceUrls[0] 
                  : propertyImages[idx % propertyImages.length];
                
                return (
                  <Card 
                    key={req.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => openDetail(req)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image - fixed size like owner page */}
                        <div className="flex-shrink-0">
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={firstImage} 
                              alt={req.title || req.category} 
                              loading="lazy" 
                              className="w-full h-full object-cover" 
                            />
                            {req.evidenceUrls && req.evidenceUrls.length > 1 && (
                              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
                                +{req.evidenceUrls.length}
                              </div>
                            )}
                          </div>
                        </div>
                        
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
                                <CheckCircle className="h-3 w-3" /> READY FOR REVIEW
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
                            <span>📍 {req.unit?.unitIdentifier}</span>
                            <span className="uppercase text-[10px]">Category: {req.category}</span>
                            <span>📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                            {req.evidenceUrls && req.evidenceUrls.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" /> {req.evidenceUrls.length} photo(s)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Delete button - only for deletable statuses */}
                        {isDeletable(req.status) && (
                          <div className="flex-shrink-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrDelete(req);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
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
              <p className="font-semibold text-foreground">📸 Include Photos</p>
              <p className="text-xs text-muted-foreground mt-1">Adding photos helps understand the issue better and speeds up resolution.</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">⚡ Priority Guidelines</p>
              <p className="text-xs text-muted-foreground mt-1">
                • Urgent: Emergency issues (water leaks, no heat)<br />
                • High: Major inconvenience<br />
                • Medium: Standard repair<br />
                • Low: Cosmetic issues
              </p>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">⏱️ Response Time</p>
              <p className="text-xs text-muted-foreground mt-1">
                Urgent: Within 24 hours<br />
                High: Within 48 hours<br />
                Standard: 3-5 business days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Request Dialog with Image Preview - Keep as is */}
      <Dialog open={showNewRequestForm} onOpenChange={setShowNewRequestForm}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Unit *</label>
              <Select value={newRequest.unit} onValueChange={val => setNewRequest({...newRequest, unit: val})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitIdentifier} - {unit.property?.title || "Property"}
                    </SelectItem>
                  ))}
                  {availableUnits.length === 0 && (
                    <SelectItem value="none" disabled>No units available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Category *</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["PLUMBING", "ELECTRICAL", "STRUCTURAL", "HVAC", "OTHER"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewRequest({...newRequest, category: cat})}
                    className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                      newRequest.category === cat 
                        ? "border-primary bg-primary/5 text-foreground" 
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Priority *</label>
              <Select value={newRequest.priority} onValueChange={val => setNewRequest({...newRequest, priority: val})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - Cosmetic issues</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Standard repair</SelectItem>
                  <SelectItem value="HIGH">High - Major inconvenience</SelectItem>
                  <SelectItem value="URGENT">Urgent - Emergency issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Issue Title *</label>
              <Input 
                className="mt-1" 
                placeholder="e.g., Leaking faucet in kitchen"
                value={newRequest.title}
                onChange={e => setNewRequest({...newRequest, title: e.target.value})}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Brief summary of the issue</p>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Detailed Description *</label>
              <Textarea 
                className="mt-1" 
                rows={5} 
                placeholder="Please provide a detailed description of the issue including location, when it started, and any relevant details..."
                value={newRequest.description}
                onChange={e => setNewRequest({...newRequest, description: e.target.value})}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Include as much detail as possible to help us resolve the issue quickly</p>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Upload Evidence (Optional)</label>
              <div className="mt-2">
                <FileUploadArea 
                  accept="image/*,.pdf" 
                  multiple 
                  label="DRAG OR CLICK TO UPLOAD" 
                  onFilesSelected={handleFileSelect} 
                  compact 
                />
              </div>
              
              {/* Image Previews */}
              {evidencePreviews.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Selected images ({evidencePreviews.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {evidencePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="h-20 w-full rounded-lg object-cover"
                        />
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewRequestForm(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={handleSubmitRequest}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Keep as is (already good) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.title || (selectedRequest ? truncateText(selectedRequest.description, 50) : "")}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={priorityColors[selectedRequest.priority]}>{selectedRequest.priority}</Badge>
                <Badge className={statusColors[selectedRequest.status]}>
                  {selectedRequest.status.replace("_", " ")}
                </Badge>
              </div>
              
              {/* Image Gallery */}
              {selectedRequest.evidenceUrls && selectedRequest.evidenceUrls.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase font-semibold text-muted-foreground">Attached Images</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequest.evidenceUrls.length} image(s)
                    </p>
                  </div>
                  <div className="relative">
                    <div className="relative h-64 md:h-96 rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={selectedRequest.evidenceUrls[currentImageIndex]} 
                        alt={`Evidence ${currentImageIndex + 1}`}
                        className="h-full w-full object-contain cursor-pointer"
                        onClick={() => openFullscreenImage(currentImageIndex)}
                      />
                      {selectedRequest.evidenceUrls.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {currentImageIndex + 1} / {selectedRequest.evidenceUrls.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Thumbnails */}
                  {selectedRequest.evidenceUrls.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                      {selectedRequest.evidenceUrls.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex ? 'border-secondary' : 'border-transparent'
                          }`}
                        >
                          <img src={url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Full Description */}
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
                  <p className="text-[10px] uppercase text-muted-foreground">Unit</p>
                  <p className="font-medium">{selectedRequest.unit?.unitIdentifier}</p>
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

              {selectedRequest.note && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase text-muted-foreground mb-1">Resolution Note</p>
                    <p className="text-sm">{selectedRequest.note}</p>
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
                      <p className="text-xs text-muted-foreground">
                        {new Date(selectedRequest.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedRequest.status === "CANCELLED" && (
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted mt-1.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Request Cancelled</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedRequest.note || "Cancelled by tenant"}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.status !== "OPEN" && selectedRequest.status !== "CANCELLED" && (
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedRequest.resolvedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tenant Actions */}
              <div className="flex gap-2">
                {selectedRequest.status === "OPEN" && (
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setRequestToCancel(selectedRequest);
                      setCancelDialogOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Cancel Request
                  </Button>
                )}
                {(selectedRequest.status === "CANCELLED" || selectedRequest.status === "CLOSED") && (
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setRequestToDelete(selectedRequest);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                  </Button>
                )}
                {selectedRequest.status === "RESOLVED" && (
                  <Button 
                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                    onClick={() => handleTenantApprove(selectedRequest)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Accept Resolution
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Request Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this maintenance request? The request will be marked as cancelled and you can delete it later.
            </p>
            <div>
              <label className="text-xs uppercase font-semibold text-muted-foreground">Reason (Optional)</label>
              <Textarea 
                className="mt-1" 
                rows={3} 
                placeholder="Please provide a reason for cancellation..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCancelDialogOpen(false)}>
                Keep Request
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleCancelRequest}>
                Yes, Cancel Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Request Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete this maintenance request? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteDialogOpen(false)}>
                Keep Request
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDeleteRequest}>
                Yes, Delete Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Dialog */}
      <Dialog open={fullscreenImageOpen} onOpenChange={setFullscreenImageOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
          <button
            onClick={() => setFullscreenImageOpen(false)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedRequest?.evidenceUrls && selectedRequest.evidenceUrls.length > 0 && (
            <div className="relative h-[85vh] flex items-center justify-center">
              <img 
                src={selectedRequest.evidenceUrls[currentImageIndex]} 
                alt={`Fullscreen ${currentImageIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
              {selectedRequest.evidenceUrls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded">
                    {currentImageIndex + 1} / {selectedRequest.evidenceUrls.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}