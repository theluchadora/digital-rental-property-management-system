import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Megaphone, Plus, Building2, Bell, ExternalLink } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { announcementsApi } from "@/lib/api/announcements";
import { propertiesApi } from "@/lib/api/properties";
import { useToast } from "@/hooks/use-toast";
import { LeaseActionButtons } from "@/components/LeaseActionButtons";
import { leasesApi } from "@/lib/api/leases";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Announcement } from "@/types/api";

function AnnouncementLeaseActions({ leaseId }: { leaseId: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["lease", leaseId],
    queryFn: () => leasesApi.getById(leaseId).then((r) => r.data.lease),
  });

  if (!data) return null;
  return (
    <LeaseActionButtons
      lease={data}
      compact
      onLeaseUpdated={(updated) => {
        queryClient.setQueryData(["lease", leaseId], updated);
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
        queryClient.invalidateQueries({ queryKey: ["leases"] });
      }}
    />
  );
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOwner = user?.role === "OWNER";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [propertyId, setPropertyId] = useState("ALL");

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementsApi.list().then((res) => res.data),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties", "owner-list"],
    queryFn: () => propertiesApi.list({ limit: 100 }).then((res) => res.data),
    enabled: isOwner,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; propertyId?: string }) =>
      announcementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Announcement Published", description: "Your message has been broadcasted." });
      setIsDialogOpen(false);
      setTitle("");
      setContent("");
      setPropertyId("ALL");
    },
    onError: () => {
      toast({ title: "Failed to publish", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title,
      content,
      propertyId: propertyId === "ALL" ? undefined : propertyId,
    });
  };

  const announcements = announcementsData?.data || [];
  const properties = propertiesData?.data || [];

  const renderAnnouncementActions = (announcement: Announcement) => {
    if (announcement.leaseId) {
      return (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <Link to={`/leases/${announcement.leaseId}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1 h-3 w-3" /> View application
            </Button>
          </Link>
          <AnnouncementLeaseActions leaseId={announcement.leaseId} />
        </div>
      );
    }
    if (announcement.invoiceId && !isOwner) {
      return (
        <div className="mt-4 border-t pt-4">
          <Link to="/payments">
            <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Pay invoice
            </Button>
          </Link>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "Applications, notices, and messages for your portfolio."
              : "Stay updated with notices from your landlord."}
          </p>
        </div>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Plus className="mr-2 h-4 w-4" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Scheduled Maintenance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Property</Label>
                  <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Portfolio (Every Tenant)</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea
                    placeholder="Write your announcement details here..."
                    className="min-h-[120px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {createMutation.isPending ? "Publishing..." : "Publish Now"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          </div>
        ) : announcements.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Bell className="mb-4 h-12 w-12 opacity-20" />
              <p className="text-lg font-medium">No Announcements</p>
              <p className="text-sm">There are no recent announcements to display.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden border-l-4 border-l-secondary">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-secondary" />
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Posted by {announcement.owner?.firstName} {announcement.owner?.lastName} •{" "}
                      {format(new Date(announcement.createdAt), "PPP p")}
                    </CardDescription>
                  </div>
                  {announcement.propertyId ? (
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] bg-background">
                      <Building2 className="h-3 w-3" /> Property Specific
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px]">
                      Global Announcement
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {announcement.content}
                </p>
                {renderAnnouncementActions(announcement)}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
