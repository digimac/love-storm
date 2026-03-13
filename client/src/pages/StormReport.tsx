/**
 * StormReport — full-screen printable report view for a single storm.
 * Accessible at /#/storms/:id/report
 * Includes an "Export PDF" button that triggers the jsPDF generator.
 */
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileDown, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { exportStormReport } from "@/lib/pdfExport";

interface StormReportData {
  generatedAt: string;
  storm: {
    id: number;
    title: string;
    description: string;
    location: string;
    need: string;
    status: string;
    stewardName: string;
    participantCount: number;
    dropCount: number;
    targetDrops: number;
    createdAt: string | null;
    expiresAt: string | null;
    tags: string[] | null;
    urgency: string;
    verified: boolean;
  };
  drops: Array<{
    id: number;
    actorName: string;
    action: string;
    category: string;
    note: string | null;
    completed: boolean;
    createdAt: string | null;
  }>;
  completedDrops: StormReportData["drops"];
  pendingDrops: StormReportData["drops"];
  completionPct: number;
  categoryBreakdown: Record<string, number>;
}

const urgencyColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
  low: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-900",
};

const categoryIcon: Record<string, string> = {
  meals: "🍽️", transport: "🚗", emotional: "💛", financial: "💰", volunteer: "🙌", support: "❤️",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function StormReport() {
  const { id } = useParams<{ id: string }>();
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery<StormReportData>({
    queryKey: ["/api/report/storm", id],
    queryFn: () => fetch(`/api/report/storm/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    // Small delay to let the button animate
    await new Promise(r => setTimeout(r, 100));
    try {
      exportStormReport(data as Parameters<typeof exportStormReport>[0]);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-4 gap-3 mt-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-3 text-destructive" size={36} />
        <p className="text-lg font-semibold">Could not load this storm's report.</p>
        <Link href="/storms">
          <Button variant="outline" className="mt-4">Back to storms</Button>
        </Link>
      </div>
    );
  }

  const { storm, drops, completedDrops, pendingDrops, completionPct, categoryBreakdown } = data;
  const totalCatDrops = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" data-testid="storm-report-page">
      {/* Nav row */}
      <div className="flex items-center justify-between mb-7 gap-4">
        <Link href={`/storms/${id}`}>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft size={14} />
            Back to storm
          </span>
        </Link>

        <Button
          onClick={handleExport}
          disabled={exporting}
          data-testid="button-export-pdf"
          className="gap-2"
        >
          {exporting
            ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
            : <><FileDown size={14} /> Export PDF</>
          }
        </Button>
      </div>

      {/* Report card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm print:shadow-none">
        {/* Header band */}
        <div className="bg-[hsl(228,54%,13%)] px-7 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-blue-200 uppercase tracking-widest mb-1">Storm Impact Report</p>
              <h1 className="font-display font-bold text-2xl leading-tight">{storm.title}</h1>
              <p className="text-blue-200 text-sm mt-1">{storm.location}</p>
            </div>
            <Badge className={`${urgencyColor[storm.urgency] ?? ""} mt-1 shrink-0 text-xs font-bold border`}>
              {storm.urgency.toUpperCase()}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-blue-200 mb-1.5">
              <span>Mission Progress</span>
              <span>{storm.dropCount} of {storm.targetDrops} drops · {completionPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-[hsl(15,75%,56%)] transition-all"
                style={{ width: `${Math.min(100, completionPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
          {[
            { value: storm.dropCount, label: "Total Drops" },
            { value: completedDrops.length, label: "Completed" },
            { value: pendingDrops.length, label: "In Progress" },
            { value: storm.participantCount, label: "Participants" },
          ].map(({ value, label }) => (
            <div key={label} className="px-4 py-4 text-center">
              <p className="text-2xl font-bold font-display text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="px-7 py-6 space-y-7">
          {/* About */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">About This Storm</h2>
            <p className="text-sm text-foreground leading-relaxed">{storm.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span><strong className="text-foreground">Needs:</strong> {storm.need}</span>
              <span>·</span>
              <span><strong className="text-foreground">Steward:</strong> {storm.stewardName}</span>
              <span>·</span>
              <span><strong className="text-foreground">Created:</strong> {formatDate(storm.createdAt)}</span>
              {storm.expiresAt && <><span>·</span><span><strong className="text-foreground">Expires:</strong> {formatDate(storm.expiresAt)}</span></>}
            </div>
            {storm.tags && storm.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {storm.tags.map(t => (
                  <span key={t} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </section>

          {/* Category breakdown */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Support by Category</h2>
            <div className="space-y-2.5">
              {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const pct = totalCatDrops > 0 ? (count / totalCatDrops) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-base w-5 text-center">{categoryIcon[cat] ?? "📌"}</span>
                    <span className="w-24 text-sm text-foreground capitalize shrink-0">{cat}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[hsl(15,75%,56%)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{count} drop{count !== 1 ? "s" : ""}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Drop log */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Drop Log ({drops.length} total)
            </h2>
            {drops.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No drops recorded yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {drops.map(drop => (
                  <div key={drop.id} className="py-3 flex items-start gap-3" data-testid={`drop-row-${drop.id}`}>
                    <span className="mt-0.5">
                      {drop.completed
                        ? <CheckCircle2 size={16} className="text-green-500" />
                        : <Clock size={16} className="text-orange-400" />
                      }
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{drop.actorName}</span>
                        <span className="text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                          {categoryIcon[drop.category] ?? ""} {drop.category}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-0.5">{drop.action}</p>
                      {drop.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">↳ {drop.note}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {formatDate(drop.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Report footer */}
        <div className="border-t border-border px-7 py-4 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Love Storm · Community Mobilization Platform · Louisville, KY</span>
          <span>Generated {formatDate(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
