/**
 * SummaryReport — platform-wide impact report.
 * Accessible at /#/report
 * Available from the Steward Dashboard with an Export PDF button.
 */
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileDown, ArrowLeft, Loader2, AlertCircle, TrendingUp, Zap, CheckCircle2, Users, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { exportSummaryReport } from "@/lib/pdfExport";

interface SummaryReportData {
  generatedAt: string;
  stats: {
    totalStorms: number;
    activeStorms: number;
    completedStorms: number;
    totalDrops: number;
    totalParticipants: number;
  };
  storms: Array<{
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
    drops: Array<{
      id: number;
      actorName: string;
      action: string;
      category: string;
      note: string | null;
      completed: boolean;
      createdAt: string | null;
    }>;
    completionPct: number;
  }>;
  pendingRequests: Array<{
    id: number;
    name: string;
    description: string;
    location: string;
    needCategory: string;
    urgency: string;
    status: string;
    createdAt: string | null;
  }>;
  categoryBreakdown: Record<string, number>;
}

const urgencyColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
};

const categoryIcon: Record<string, string> = {
  meals: "🍽️", transport: "🚗", emotional: "💛", financial: "💰", volunteer: "🙌", support: "❤️",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function SummaryReport() {
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery<SummaryReportData>({
    queryKey: ["/api/report/summary"],
    queryFn: () => fetch("/api/report/summary").then(r => r.json()),
  });

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      exportSummaryReport(data as Parameters<typeof exportSummaryReport>[0]);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-5 gap-3 mt-6">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-3 text-destructive" size={36} />
        <p className="text-lg font-semibold">Could not load the platform report.</p>
        <Link href="/steward">
          <Button variant="outline" className="mt-4">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const { stats, storms, pendingRequests, categoryBreakdown } = data;
  const totalCatDrops = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="summary-report-page">
      {/* Nav row */}
      <div className="flex items-center justify-between mb-7 gap-4">
        <Link href="/steward">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft size={14} />
            Back to dashboard
          </span>
        </Link>

        <Button
          onClick={handleExport}
          disabled={exporting}
          data-testid="button-export-summary-pdf"
          className="gap-2"
        >
          {exporting
            ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
            : <><FileDown size={14} /> Export PDF</>
          }
        </Button>
      </div>

      {/* Report card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Header band */}
        <div className="bg-[hsl(228,54%,13%)] px-7 py-6 text-white">
          <p className="text-xs font-medium text-blue-200 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <TrendingUp size={11} /> Platform Impact Report
          </p>
          <h1 className="font-display font-bold text-2xl leading-tight">Love Storm — Impact Overview</h1>
          <p className="text-blue-200 text-sm mt-1">All storms · Generated {formatDate(data.generatedAt)}</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-5 divide-x divide-border border-b border-border">
          {[
            { icon: <Zap size={14} />, value: stats.totalStorms, label: "Total Storms" },
            { icon: <Zap size={14} className="text-green-500" />, value: stats.activeStorms, label: "Active" },
            { icon: <CheckCircle2 size={14} />, value: stats.completedStorms, label: "Completed" },
            { icon: <Users size={14} />, value: stats.totalDrops, label: "Total Drops" },
            { icon: <Users size={14} />, value: stats.totalParticipants, label: "Participants" },
          ].map(({ value, label }) => (
            <div key={label} className="px-3 py-4 text-center">
              <p className="text-2xl font-bold font-display text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="px-7 py-6 space-y-8">
          {/* Category breakdown */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Drops by Category</h2>
            <div className="space-y-2.5">
              {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const pct = totalCatDrops > 0 ? (count / totalCatDrops) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-base w-5 text-center">{categoryIcon[cat] ?? "📌"}</span>
                    <span className="w-24 text-sm text-foreground capitalize shrink-0">{cat}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-[hsl(15,75%,56%)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">{count} drop{count !== 1 ? "s" : ""}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Storm summary table */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">All Storms</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[hsl(228,54%,13%)] text-white">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Storm</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Location</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide">Urgency</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide">Drops</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide">Progress</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {storms.map((storm, i) => (
                    <tr key={storm.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground text-sm">{storm.title}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[180px]">{storm.stewardName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{storm.location}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge className={`${urgencyColor[storm.urgency]} text-xs`}>{storm.urgency}</Badge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs font-medium ${storm.status === "active" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {storm.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-mono">
                        {storm.dropCount} / {storm.targetDrops}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[40px]">
                            <div
                              className="h-full rounded-full bg-[hsl(15,75%,56%)]"
                              style={{ width: `${Math.min(100, storm.completionPct)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-9 text-right">{storm.completionPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/storms/${storm.id}/report`}>
                          <span className="text-xs text-primary hover:underline cursor-pointer">View →</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pending requests (if any) */}
          {pendingRequests.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <ClipboardList size={12} />
                {pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? "s" : ""}
              </h2>
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {pendingRequests.map((req, i) => (
                  <div key={req.id} className={`px-4 py-3 ${i % 2 === 1 ? "bg-muted/30" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{req.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{req.location} · {req.needCategory}</p>
                        <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{req.description}</p>
                      </div>
                      <Badge className={`${urgencyColor[req.urgency]} text-xs shrink-0`}>{req.urgency}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-7 py-4 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Love Storm · Community Mobilization Platform · Louisville, KY</span>
          <span>Generated {formatDate(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
