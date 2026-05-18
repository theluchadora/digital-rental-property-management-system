import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { incidentsApi } from "@/lib/api/incidents";
import { 
  AlertTriangle, 
  Shield, 
  Upload, 
  X, 
  Send, 
  Phone, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  Flag,
  HelpCircle,
  Users,
  Building2,
  Heart,
  ExternalLink,
  CheckCircle,
  FileWarning,
  Camera
} from "lucide-react";

type ComplaintType = "VIOLENCE" | "HARASSMENT" | "THREAT" | "DISCRIMINATION" | "THEFT" | "DAMAGE" | "NOISE" | "OTHER";
type Urgency = "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
type ReportType = "COMPLAINT" | "HELP_REQUEST";

const complaintTypeLabels: Record<ComplaintType, string> = {
  VIOLENCE: "Physical Violence / Assault",
  HARASSMENT: "Harassment / Intimidation",
  THREAT: "Threats / Verbal Abuse",
  DISCRIMINATION: "Discrimination / Hate Speech",
  THEFT: "Theft / Property Damage",
  DAMAGE: "Vandalism / Property Destruction",
  NOISE: "Excessive Noise / Disturbance",
  OTHER: "Other Incident"
};

const urgencyColors: Record<Urgency, string> = {
  EMERGENCY: "bg-destructive text-destructive-foreground animate-pulse",
  HIGH: "bg-warning text-warning-foreground",
  MEDIUM: "bg-secondary/10 text-secondary",
  LOW: "bg-muted text-muted-foreground"
};

export default function ReportIncidentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [reportType, setReportType] = useState<ReportType>("COMPLAINT");
  const [complaintType, setComplaintType] = useState<ComplaintType>("VIOLENCE");
  const [urgency, setUrgency] = useState<Urgency>("MEDIUM");
  const [againstPerson, setAgainstPerson] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.role === "OWNER";
  const isTenant = user?.role === "TENANT";

  const [searchParams] = useSearchParams();
  const prefilledReportedUserId = searchParams.get("reportedUserId") || undefined;
  const [reportedUserId] = useState<string | undefined>(prefilledReportedUserId);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
        return false;
      }
      return true;
    });
    
    setEvidenceFiles(prev => [...prev, ...validFiles]);
    
    // Create preview URLs for images
    validFiles.forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEvidencePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-images, show file icon
        setEvidencePreviews(prev => [...prev, "file"]);
      }
    });
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    setEvidencePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({ title: "Missing Information", description: "Please provide a detailed description of the incident.", variant: "destructive" });
      return;
    }
    
    if (!location.trim()) {
      toast({ title: "Missing Information", description: "Please provide the location where the incident occurred.", variant: "destructive" });
      return;
    }
    
    if (!incidentDate) {
      toast({ title: "Missing Information", description: "Please provide the date of the incident.", variant: "destructive" });
      return;
    }
    
    if (!agreeToTerms) {
      toast({ title: "Terms Required", description: "Please agree to the terms before submitting.", variant: "destructive" });
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create the incident report
      const { data } = await incidentsApi.create({
        reportType,
        incidentType: complaintType,
        urgency,
        description,
        location,
        incidentDate,
        incidentTime: incidentTime || undefined,
        witnesses: witnesses || undefined,
        againstPerson: againstPerson || undefined,
        isAnonymous,
        reportedUserId,
      });
      const reportId = data.report.id;

      // 2. Upload each evidence file
      if (evidenceFiles.length > 0) {
        await Promise.allSettled(
          evidenceFiles.map((file) => incidentsApi.uploadEvidence(reportId, file))
        );
      }

      toast({
        title: reportType === "HELP_REQUEST" ? "Help Request Sent" : "Complaint Filed",
        description: `Your report has been received (Ref: ${reportId.slice(0, 8).toUpperCase()}). You will receive updates via notifications.`,
      });

      // Reset form
      setDescription("");
      setLocation("");
      setIncidentDate("");
      setIncidentTime("");
      setWitnesses("");
      setAgainstPerson("");
      setEvidenceFiles([]);
      setEvidencePreviews([]);
      setAgreeToTerms(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: "Submission failed",
        description: error?.response?.data?.error || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
      setIsSubmitting(false);
    }
  };

  const getEmergencyContact = () => {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <Phone className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-destructive mb-1">Emergency Contacts</h4>
            <p className="text-sm text-foreground mb-2">
              If you are in immediate danger or witnessing violence, call emergency services immediately:
            </p>
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">🚨 Police Emergency:</span> 911</p>
              <p><span className="font-semibold">🏥 Medical Emergency:</span> 911</p>
              <p><span className="font-semibold">🆘 Domestic Violence Hotline:</span> 1-800-799-7233</p>
              <p><span className="font-semibold">💬 Crisis Text Line:</span> Text HOME to 741741</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Flag className="h-6 w-6 md:h-8 md:w-8 text-destructive" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isOwner ? "Property Incident Report" : "Tenant Complaint & Help Center"}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isOwner 
            ? "Report incidents, document violations, and maintain property safety records."
            : "Your safety matters. Report incidents, seek help, or file formal complaints. All reports are confidential."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Emergency Warning - Only show for urgent cases or always for violence */}
          {(complaintType === "VIOLENCE" || urgency === "EMERGENCY") && getEmergencyContact()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" />
                Report Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Type Selection */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Report Type *
                </Label>
                <RadioGroup 
                  value={reportType} 
                  onValueChange={(v) => setReportType(v as ReportType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="COMPLAINT" id="complaint" />
                    <Label htmlFor="complaint" className="cursor-pointer">Formal Complaint</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HELP_REQUEST" id="help" />
                    <Label htmlFor="help" className="cursor-pointer text-warning">Request Help / Support</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Incident Type */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Incident Type *
                </Label>
                <Select value={complaintType} onValueChange={(v) => setComplaintType(v as ComplaintType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(complaintTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Urgency Level */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Urgency Level *
                </Label>
                <RadioGroup value={urgency} onValueChange={(v) => setUrgency(v as Urgency)} className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EMERGENCY" id="emergency" />
                    <Label htmlFor="emergency" className="cursor-pointer text-destructive font-semibold">🚨 Emergency</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HIGH" id="high" />
                    <Label htmlFor="high" className="cursor-pointer">⚠️ High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MEDIUM" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LOW" id="low" />
                    <Label htmlFor="low" className="cursor-pointer">Low</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Against Person (optional) */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Person/Party Involved (Optional)
                </Label>
                <Input 
                  placeholder="Name of individual or group (if known)"
                  value={againstPerson}
                  onChange={(e) => setAgainstPerson(e.target.value)}
                />
              </div>

              {/* Location */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Location of Incident *
                </Label>
                <Input 
                  placeholder="e.g., Building A, Floor 3, Unit 402"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incidentDate" className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                    Date of Incident *
                  </Label>
                  <Input 
                    id="incidentDate"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                    Time of Incident (Approx.)
                  </Label>
                  <Input 
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Detailed Description *
                </Label>
                <Textarea 
                  rows={8}
                  placeholder="Please provide a thorough description of what happened, including:&#10;• What occurred&#10;• Who was involved&#10;• Any witnesses present&#10;• Any prior incidents&#10;• How it affected you or others"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length} characters • Be as specific as possible
                </p>
              </div>

              {/* Witnesses */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Witnesses (Optional)
                </Label>
                <Textarea 
                  rows={2}
                  placeholder="Names and contact information of any witnesses"
                  value={witnesses}
                  onChange={(e) => setWitnesses(e.target.value)}
                />
              </div>

              {/* Evidence Upload */}
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground mb-2 block">
                  Evidence / Supporting Documents
                </Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.mp4,.mov"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click or drag to upload photos, videos, or documents
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 10 files • 10MB each • Images, PDFs, Videos
                  </p>
                </div>
                
                {/* Evidence Previews */}
                {evidencePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">{evidencePreviews.length} file(s) attached</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {evidencePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          {preview === "file" ? (
                            <div className="h-20 bg-muted rounded-lg flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          ) : (
                            <img 
                              src={preview} 
                              alt={`Evidence ${index + 1}`}
                              className="h-20 w-full rounded-lg object-cover"
                            />
                          )}
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {evidenceFiles[index]?.type.startsWith("video/") && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <Camera className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-border"
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer text-sm">
                    Submit anonymously (your identity will be hidden)
                  </Label>
                </div>
                <Badge variant="outline" className="text-[10px]">Confidential</Badge>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I confirm that the information provided is accurate to the best of my knowledge. 
                  I understand that false reports may be subject to review.
                </Label>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit}
                disabled={!description || !location || !incidentDate || !agreeToTerms || isSubmitting}
                className="w-full bg-destructive hover:bg-destructive/90 text-white"
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {reportType === "HELP_REQUEST" ? "Submit Help Request" : "File Complaint"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Guidelines Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-secondary" />
                Guidelines & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/5 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Shield className="h-4 w-4 text-secondary" />
                  Your Safety First
                </h4>
                <p className="text-xs text-muted-foreground">
                  If you feel unsafe or are in immediate danger, please contact emergency services immediately 
                  before filing this report.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">📋 What to Include</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Specific dates and times</li>
                  <li>Exact location details</li>
                  <li>Names of people involved</li>
                  <li>Any witnesses present</li>
                  <li>Photos or video evidence</li>
                  <li>Prior related incidents</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">⚡ Response Times</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-destructive font-semibold">Emergency:</span>
                    <span>Immediate (Call 911)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warning font-semibold">High Urgency:</span>
                    <span>Within 2 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Urgency:</span>
                    <span>Within 24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Urgency:</span>
                    <span>3-5 business days</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Heart className="h-4 w-4 text-destructive" />
                  Support Resources
                </h4>
                <div className="space-y-2 text-xs">
                  <p><span className="font-semibold">🏢 Property Management:</span> (555) 123-4567</p>
                  <p><span className="font-semibold">👮 Tenant Advocate:</span> (555) 987-6543</p>
                  <p><span className="font-semibold">⚖️ Legal Aid:</span> (555) 456-7890</p>
                  <a href="#" className="text-secondary hover:underline flex items-center gap-1">
                    Counseling Services <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-3 w-3 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">1. Review Process</p>
                  <p className="text-xs text-muted-foreground">Your report will be reviewed by property management within response time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-3 w-3 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">2. Investigation</p>
                  <p className="text-xs text-muted-foreground">Appropriate parties may be contacted for additional information.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">3. Resolution</p>
                  <p className="text-xs text-muted-foreground">You'll receive updates and resolution details via your preferred contact method.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confidentiality Notice */}
          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold mb-1">Confidentiality Guarantee</p>
                  <p className="text-xs text-muted-foreground">
                    All reports are handled with strict confidentiality. Your information will only be shared 
                    with authorized personnel on a need-to-know basis. Retaliation is prohibited and will be 
                    addressed immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Submission
            </DialogTitle>
            <DialogDescription>
              Please review your report before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">Type: {reportType === "HELP_REQUEST" ? "Help Request" : "Formal Complaint"}</p>
              <p className="font-semibold mb-1">Incident: {complaintTypeLabels[complaintType]}</p>
              <p className="font-semibold mb-1">Urgency: {urgency}</p>
              <p>Location: {location}</p>
              <p>Date: {incidentDate}</p>
            </div>
            <p>
              {urgency === "EMERGENCY" ? (
                <span className="text-destructive font-semibold">
                  ⚠️ This is marked as an emergency. If you haven't already, please call emergency services at 911.
                </span>
              ) : (
                "Your report will be reviewed according to the urgency level specified."
              )}
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-destructive hover:bg-destructive/90" onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}