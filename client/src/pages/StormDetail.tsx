import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapPin, Users, ArrowLeft, CheckCircle, Clock, Zap, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Storm, Drop } from "@shared/schema";

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
  critical: "text-red-600 bg-red-50 dark:bg-red-950/30",
  high: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30",
  low: "text-green-600 bg-green-50 dark:bg-green-950/30",
};

const categoryIcons: Record<string, string> = {
  meals: "🍽️",
  transport: "🚗",
  emotional: "💛",
  financial: "💙",
  volunteer: "🤝",
  support: "❤️",
};

export default function StormDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [showDropForm, setShowDropForm] = useState(false);
  const [dropForm, setDropForm] = useState({
    actorName: "",
    action: "",
    category: "volunteer",
    note: "",
  });

  const stormId = parseInt(id ?? "0");

  const { data: storm, isLoading: stormLoading } = useQuery<Storm>({
    queryKey: ["/api/storms", stormId],
    queryFn: async () => {
      const res = await fetch(`/api/storms/${stormId}`);
      if (!res.ok) throw new Error("Storm not found");
      return res.json();
    },
    enabled: !isNaN(stormId),
  });

  const { data: drops, isLoading: dropsLoading } = useQuery<Drop[]>({
    queryKey: ["/api/storms", stormId, "drops"],
    queryFn: async () => {
      const res = await fetch(`/api/storms/${stormId}/drops`);
      if (!res.ok) throw new Error("Could not fetch drops");
      return res.json();
    },
    enabled: !isNaN(stormId),
  });

  const createDropMutation = useMutation({
    mutationFn: (data: typeof dropForm & { stormId: number }) =>
      apiRequest("POST", "/api/drops", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storms", stormId, "drops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storms", stormId] });
      queryClient.invalidateQueries({ queryKey: ["/api/storms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowDropForm(false);
      setDropForm({ actorName: "", action: "", category: "volunteer", note: "" });
      toast({ title: "Drop added", description: "Your commitment has been logged." });
    },
    onError: () => {
      toast({ title: "Something went wrong", variant: "destructive" });
    },
  });

  const handleSubmitDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropForm.actorName.trim() || !dropForm.action.trim()) return;
    createDropMutation.mutate({ ...dropForm, stormId });
  };

  if (stormLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!storm) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Storm not found.</p>
        <Link href="/storms"><Button variant="link">Back to storms</Button></Link>
      </div>
    );
  }

  const dropPct = Math.min(100, Math.round((storm.dropCount / Math.max(storm.targetDrops, 1)) * 100));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/storms">
        <Button variant="ghost" size="sm" className="mb-5 -ml-2 text-muted-foreground gap-1.5" data-testid="button-back">
          <ArrowLeft size={14} /> All storms
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColor[storm.urgency]}`}>
          {storm.urgency.charAt(0).toUpperCase() + storm.urgency.slice(1)} urgency
        </span>
        {storm.verified && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/30">
            <CheckCircle size={10} /> Verified
          </span>
        )}
      </div>

      <h1 className="font-display text-xl font-bold mb-3 leading-snug" data-testid="text-storm-title">{storm.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-5">
        <span className="flex items-center gap-1"><MapPin size={11} />{storm.location}</span>
        <span className="flex items-center gap-1"><Users size={11} />{storm.participantCount} participants</span>
        <span>Steward: {storm.stewardName}</span>
        <span>{timeAgo(storm.createdAt)}</span>
      </div>

      <p className="text-base text-foreground leading-relaxed mb-6 p-4 bg-muted/40 rounded-lg border border-border">
        {storm.description}
      </p>

      {/* Need tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {storm.tags?.map(tag => (
          <span key={tag} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{tag}</span>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="font-display font-bold text-2xl">{storm.dropCount}</span>
            <span className="text-muted-foreground text-sm"> / {storm.targetDrops} drops</span>
          </div>
          <span className="text-lg font-bold text-[hsl(15,75%,56%)]">{dropPct}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-3">
          <div
            className="h-full bg-[hsl(15,75%,56%)] rounded-full progress-bar-fill"
            style={{ width: `${dropPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {storm.targetDrops - storm.dropCount > 0
            ? `${storm.targetDrops - storm.dropCount} more drops needed to reach the goal`
            : "Goal reached! This storm is fully supported."}
        </p>
      </div>

      {/* Drop your drop CTA */}
      {storm.status === "active" && (
        <div className="mb-8">
          <Button
            className="w-full bg-[hsl(15,75%,56%)] hover:bg-[hsl(15,75%,50%)] text-white font-semibold h-11 gap-2"
            onClick={() => setShowDropForm(v => !v)}
            data-testid="button-add-drop"
          >
            <Heart size={16} />
            {showDropForm ? "Cancel" : "Drop a commitment"}
            {showDropForm ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
          </Button>

          {showDropForm && (
            <form
              onSubmit={handleSubmitDrop}
              className="mt-3 p-4 bg-card border border-border rounded-xl space-y-4"
              data-testid="form-drop"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="actorName" className="text-xs">Your name</Label>
                  <Input
                    id="actorName"
                    placeholder="e.g. Sarah M."
                    value={dropForm.actorName}
                    onChange={e => setDropForm(f => ({ ...f, actorName: e.target.value }))}
                    required
                    data-testid="input-actor-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-xs">Category</Label>
                  <Select value={dropForm.category} onValueChange={v => setDropForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryIcons).map(([val, icon]) => (
                        <SelectItem key={val} value={val}>{icon} {val.charAt(0).toUpperCase() + val.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="action" className="text-xs">What will you do?</Label>
                <Input
                  id="action"
                  placeholder="e.g. Bringing dinner Tuesday evening"
                  value={dropForm.action}
                  onChange={e => setDropForm(f => ({ ...f, action: e.target.value }))}
                  required
                  data-testid="input-action"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note" className="text-xs">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Any details the steward should know…"
                  value={dropForm.note}
                  onChange={e => setDropForm(f => ({ ...f, note: e.target.value }))}
                  className="h-20 resize-none"
                  data-testid="input-note"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground"
                disabled={createDropMutation.isPending}
                data-testid="button-submit-drop"
              >
                {createDropMutation.isPending ? "Logging…" : "Log my drop"}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Drops list */}
      <div>
        <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
          <Zap size={15} className="text-[hsl(15,75%,56%)]" />
          Drops logged ({drops?.length ?? 0})
        </h2>

        {dropsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : drops && drops.length > 0 ? (
          <div className="space-y-2">
            {drops.map(drop => (
              <div key={drop.id} className="drop-item flex items-start gap-3 p-3 bg-card border border-border rounded-lg" data-testid={`drop-item-${drop.id}`}>
                <span className="text-lg leading-none mt-0.5">{categoryIcons[drop.category] ?? "❤️"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{drop.actorName}</span>
                    {drop.completed && (
                      <span className="flex items-center gap-0.5 text-xs text-green-600">
                        <CheckCircle size={10} /> Done
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(drop.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{drop.action}</p>
                  {drop.note && <p className="text-xs text-muted-foreground mt-0.5 italic">{drop.note}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No drops yet. Be the first to commit.</p>
        )}
      </div>
    </div>
  );
}
