import { Link } from "wouter";
import { MapPin, Users, Zap, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Storm } from "@shared/schema";

const urgencyLabel: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const urgencyClass: Record<string, string> = {
  critical: "urgency-critical urgency-bg-critical",
  high: "urgency-high urgency-bg-high",
  medium: "urgency-medium urgency-bg-medium",
  low: "urgency-low urgency-bg-low",
};

const statusIcon: Record<string, React.ReactNode> = {
  active: <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium"><Zap size={11} className="storm-pulse" /> Active</span>,
  completed: <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><CheckCircle size={11} /> Completed</span>,
  reviewing: <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium"><Clock size={11} /> Reviewing</span>,
};

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-label={`${value} of ${max} drops`}>
      <div
        className="h-full bg-[hsl(15,75%,56%)] progress-bar-fill rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StormCard({ storm }: { storm: Storm }) {
  const dropPct = Math.min(100, Math.round((storm.dropCount / Math.max(storm.targetDrops, 1)) * 100));

  return (
    <Link href={`/storms/${storm.id}`}>
      <article
        className="storm-card bg-card border border-border rounded-xl p-4 cursor-pointer block"
        data-testid={`card-storm-${storm.id}`}
      >
        {/* Top row: urgency + status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${urgencyClass[storm.urgency] || ""}`}>
            {urgencyLabel[storm.urgency] || storm.urgency}
          </span>
          <div>{statusIcon[storm.status] || storm.status}</div>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-base leading-snug mb-1.5 line-clamp-2">
          {storm.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {storm.description}
        </p>

        {/* Location + time */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><MapPin size={11} />{storm.location}</span>
          <span>{timeAgo(storm.createdAt)}</span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{storm.dropCount} drops given</span>
            <span>{dropPct}% of goal</span>
          </div>
          <ProgressBar value={storm.dropCount} max={storm.targetDrops} />
        </div>

        {/* Participants + steward */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={11} /> {storm.participantCount} participants
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {storm.stewardName}
          </span>
        </div>

        {/* Tags */}
        {storm.tags && storm.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {storm.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
