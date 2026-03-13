import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Filter } from "lucide-react";
import { StormCard } from "@/components/StormCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Storm } from "@shared/schema";

const FILTERS = ["all", "active", "completed"] as const;
const URGENCY_FILTERS = ["all", "critical", "high", "medium", "low"] as const;

type StatusFilter = typeof FILTERS[number];
type UrgencyFilter = typeof URGENCY_FILTERS[number];

export default function StormFeed() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");

  const { data: storms, isLoading } = useQuery<Storm[]>({ queryKey: ["/api/storms"] });

  const filtered = storms?.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (urgencyFilter !== "all" && s.urgency !== urgencyFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-xl font-bold flex items-center gap-2 mb-1">
          <Zap size={20} className="text-[hsl(15,75%,56%)]" />
          Storm Feed
        </h1>
        <p className="text-sm text-muted-foreground">Real needs, real community. Every storm is a chance to act.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-1 mr-2">
          <Filter size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Status:</span>
        </div>
        {FILTERS.map(f => (
          <Button
            key={f}
            variant={statusFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f)}
            className={`text-xs h-7 capitalize ${statusFilter === f ? "bg-primary text-primary-foreground" : ""}`}
            data-testid={`filter-status-${f}`}
          >
            {f}
          </Button>
        ))}

        <div className="flex items-center gap-1 ml-3 mr-1">
          <span className="text-xs text-muted-foreground">Urgency:</span>
        </div>
        {URGENCY_FILTERS.map(f => (
          <Button
            key={f}
            variant={urgencyFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setUrgencyFilter(f)}
            className={`text-xs h-7 capitalize ${urgencyFilter === f ? "bg-primary text-primary-foreground" : ""}`}
            data-testid={`filter-urgency-${f}`}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground mb-4">
          {filtered?.length ?? 0} storm{(filtered?.length ?? 0) !== 1 ? "s" : ""} shown
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(storm => <StormCard key={storm.id} storm={storm} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Zap size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No storms match these filters.</p>
        </div>
      )}
    </div>
  );
}
