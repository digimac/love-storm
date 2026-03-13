import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard, Zap, ClipboardList, CheckCircle, Users,
  AlertTriangle, Clock, Plus, Eye, X, ChevronRight, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import type { Storm, Request } from "@shared/schema";

interface Stats {
  totalStorms: number;
  activeStorms: number;
  totalDrops: number;
  totalParticipants: number;
  completedStorms: number;
}

function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const urgencyColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
};

export default function StewardDashboard() {
  const { toast } = useToast();
  const [showCreateStorm, setShowCreateStorm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", description: "", location: "", need: "",
    stewardName: "", targetDrops: "10", urgency: "medium",
    tags: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({ queryKey: ["/api/stats"] });
  const { data: storms, isLoading: stormsLoading } = useQuery<Storm[]>({ queryKey: ["/api/storms"] });
  const { data: requests, isLoading: requestsLoading } = useQuery<Request[]>({ queryKey: ["/api/requests"] });

  const pendingRequests = requests?.filter(r => r.status === "pending") ?? [];
  const activeStorms = storms?.filter(s => s.status === "active") ?? [];

  const createStormMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/storms", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowCreateStorm(false);
      setCreateForm({ title: "", description: "", location: "", need: "", stewardName: "", targetDrops: "10", urgency: "medium", tags: "" });
      toast({ title: "Storm created", description: "The storm is now live in the feed." });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      apiRequest("PATCH", `/api/requests/${id}`, { status, stewardNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: "Request updated" });
    },
  });

  const completeStormMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/storms/${id}`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Storm marked complete" });
    },
  });

  const handleCreateStorm = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = createForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    createStormMutation.mutate({
      ...createForm,
      targetDrops: parseInt(createForm.targetDrops),
      tags,
      status: "active",
      participantCount: 0,
      dropCount: 0,
      verified: true,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-xl font-bold flex items-center gap-2 mb-1">
            <LayoutDashboard size={20} className="text-[hsl(226,52%,40%)]" />
            Steward Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Manage active storms, review requests, and track impact.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/report">
            <Button variant="outline" className="gap-2" data-testid="button-platform-report">
              <FileDown size={14} />
              Export Report
            </Button>
          </Link>
          <Button
            onClick={() => setShowCreateStorm(true)}
            className="bg-primary text-primary-foreground gap-2"
            data-testid="button-create-storm"
          >
            <Plus size={15} />
            New Storm
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Active", value: stats?.activeStorms, icon: Zap, color: "text-blue-600 dark:text-blue-400" },
          { label: "Pending Reqs", value: pendingRequests.length, icon: ClipboardList, color: "text-orange-600 dark:text-orange-400" },
          { label: "Total Drops", value: stats?.totalDrops, icon: CheckCircle, color: "text-[hsl(15,75%,56%)]" },
          { label: "Participants", value: stats?.totalParticipants, icon: Users, color: "text-purple-600 dark:text-purple-400" },
          { label: "Completed", value: stats?.completedStorms, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1">
            <Icon size={14} className={color} />
            <div className="font-display font-bold text-xl" data-testid={`stat-${label.toLowerCase().replace(" ", "-")}`}>
              {statsLoading ? <Skeleton className="h-6 w-8" /> : value?.toLocaleString() ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs: Active Storms | Pending Requests */}
      <Tabs defaultValue="storms" className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="storms" data-testid="tab-storms">
            Active Storms {activeStorms.length > 0 && `(${activeStorms.length})`}
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Pending Requests {pendingRequests.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[hsl(0,72%,55%)] text-white text-[10px]">{pendingRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Storms</TabsTrigger>
        </TabsList>

        {/* Active Storms Tab */}
        <TabsContent value="storms">
          {stormsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : activeStorms.length > 0 ? (
            <div className="space-y-3">
              {activeStorms.map(storm => {
                const pct = Math.min(100, Math.round((storm.dropCount / Math.max(storm.targetDrops, 1)) * 100));
                return (
                  <div key={storm.id} className="bg-card border border-border rounded-xl p-4" data-testid={`steward-storm-${storm.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${urgencyColor[storm.urgency]}`}>
                            {storm.urgency}
                          </span>
                          {storm.verified && (
                            <span className="text-xs text-green-600 flex items-center gap-0.5"><CheckCircle size={10} /> Verified</span>
                          )}
                        </div>
                        <h3 className="font-display font-semibold text-sm leading-snug mb-1 line-clamp-1">{storm.title}</h3>
                        <div className="text-xs text-muted-foreground mb-2">{storm.location} · {storm.participantCount} participants · {timeAgo(storm.createdAt)}</div>
                        {/* Mini progress */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
                            <div className="h-full bg-[hsl(15,75%,56%)] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{storm.dropCount}/{storm.targetDrops}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <Link href={`/storms/${storm.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" data-testid={`button-view-storm-${storm.id}`}>
                            <Eye size={11} /> View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50 gap-1"
                          onClick={() => completeStormMutation.mutate(storm.id)}
                          disabled={completeStormMutation.isPending}
                          data-testid={`button-complete-storm-${storm.id}`}
                        >
                          <CheckCircle size={11} /> Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No active storms.</p>
          )}
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="requests">
          {requestsLoading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-card border border-border rounded-xl p-4" data-testid={`request-item-${req.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${urgencyColor[req.urgency]}`}>
                          {req.urgency}
                        </span>
                        <span className="text-xs text-muted-foreground">{req.needCategory}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{timeAgo(req.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed mb-1 line-clamp-3">{req.description}</p>
                      <p className="text-xs text-muted-foreground">{req.location}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-primary text-primary-foreground gap-1"
                        onClick={() => approveRequestMutation.mutate({ id: req.id, status: "approved" })}
                        disabled={approveRequestMutation.isPending}
                        data-testid={`button-approve-request-${req.id}`}
                      >
                        <CheckCircle size={11} /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 border-red-200 gap-1"
                        onClick={() => approveRequestMutation.mutate({ id: req.id, status: "rejected" })}
                        disabled={approveRequestMutation.isPending}
                        data-testid={`button-reject-request-${req.id}`}
                      >
                        <X size={11} /> Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <CheckCircle size={28} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">All caught up — no pending requests.</p>
            </div>
          )}
        </TabsContent>

        {/* All Storms Tab */}
        <TabsContent value="all">
          {stormsLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : storms && storms.length > 0 ? (
            <div className="space-y-2">
              {storms.map(storm => (
                <div key={storm.id} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted/40 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${storm.status === "active" ? "bg-blue-500" : "bg-green-500"}`} />
                  <span className="text-sm font-medium flex-1 truncate">{storm.title}</span>
                  <span className="text-xs text-muted-foreground">{storm.dropCount}/{storm.targetDrops}</span>
                  <Link href={`/storms/${storm.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight size={13} /></Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No storms yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Storm Dialog */}
      <Dialog open={showCreateStorm} onOpenChange={setShowCreateStorm}>
        <DialogContent className="max-w-lg" data-testid="dialog-create-storm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Create a new Storm</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStorm} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cs-title" className="text-xs">Title</Label>
              <Input id="cs-title" required value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief, human description of the need" data-testid="input-storm-title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-desc" className="text-xs">Description</Label>
              <Textarea id="cs-desc" required value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="What's happening? What does this person/family need?" className="h-24 resize-none" data-testid="input-storm-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cs-loc" className="text-xs">Location</Label>
                <Input id="cs-loc" required value={createForm.location} onChange={e => setCreateForm(f => ({ ...f, location: e.target.value }))} placeholder="Neighborhood, city" data-testid="input-storm-location" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-need" className="text-xs">Primary need</Label>
                <Input id="cs-need" value={createForm.need} onChange={e => setCreateForm(f => ({ ...f, need: e.target.value }))} placeholder="meals, rides, etc." data-testid="input-storm-need" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cs-steward" className="text-xs">Steward name</Label>
                <Input id="cs-steward" required value={createForm.stewardName} onChange={e => setCreateForm(f => ({ ...f, stewardName: e.target.value }))} placeholder="Your name or org" data-testid="input-storm-steward" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-target" className="text-xs">Target drops</Label>
                <Input id="cs-target" type="number" min="1" value={createForm.targetDrops} onChange={e => setCreateForm(f => ({ ...f, targetDrops: e.target.value }))} data-testid="input-storm-target" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cs-urgency" className="text-xs">Urgency</Label>
                <Select value={createForm.urgency} onValueChange={v => setCreateForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger id="cs-urgency" data-testid="select-storm-urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-tags" className="text-xs">Tags (comma-separated)</Label>
                <Input id="cs-tags" value={createForm.tags} onChange={e => setCreateForm(f => ({ ...f, tags: e.target.value }))} placeholder="meals, crisis, family" data-testid="input-storm-tags" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateStorm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={createStormMutation.isPending} data-testid="button-submit-create-storm">
                {createStormMutation.isPending ? "Creating…" : "Create Storm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
