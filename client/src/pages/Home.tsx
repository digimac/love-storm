import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Zap, Heart, Users, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StormCard } from "@/components/StormCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Storm } from "@shared/schema";

interface Stats {
  totalStorms: number;
  activeStorms: number;
  totalDrops: number;
  totalParticipants: number;
  completedStorms: number;
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({ queryKey: ["/api/stats"] });
  const { data: storms, isLoading: stormsLoading } = useQuery<Storm[]>({ queryKey: ["/api/storms"] });

  const urgentStorms = storms?.filter(s => s.status === "active" && (s.urgency === "critical" || s.urgency === "high")).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(226,52%,24%)] via-[hsl(222,42%,18%)] to-[hsl(226,30%,12%)] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(15,75%,56%)] storm-pulse" />
                {statsLoading ? "..." : stats?.activeStorms} active storms
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
              When someone needs help,<br />
              <span className="text-[hsl(15,75%,72%)]">a community shows up.</span>
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl">
              Love Storm mobilizes neighbors to meet real, immediate needs — with dignity, discernment, and collective action. No red tape. Just people helping people.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/storms">
                <Button size="lg" className="bg-[hsl(15,75%,56%)] hover:bg-[hsl(15,75%,50%)] text-white font-semibold border-none shadow-lg" data-testid="button-view-storms">
                  <Zap size={16} className="mr-2" />
                  See Active Storms
                </Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="button-request-help">
                  Request Help
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative SVG storm lines */}
        <div className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none opacity-[0.06]" aria-hidden="true">
          <svg viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M250 0 L180 200 L230 200 L120 600 L300 250 L240 250 L350 0Z" fill="white"/>
            <path d="M380 50 L330 180 L365 180 L280 450 L420 210 L375 210 L460 50Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap, label: "Active Storms", value: stats?.activeStorms, color: "text-[hsl(226,52%,40%)]" },
            { icon: Users, label: "Participants", value: stats?.totalParticipants, color: "text-[hsl(15,75%,56%)]" },
            { icon: Heart, label: "Drops Given", value: stats?.totalDrops, color: "text-[hsl(152,52%,44%)]" },
            { icon: CheckCircle, label: "Completed", value: stats?.completedStorms, color: "text-[hsl(43,86%,50%)]" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={20} className={`${color} flex-shrink-0`} />
              <div>
                <div className="text-xl font-display font-bold" data-testid={`stat-${label.toLowerCase().replace(" ", "-")}`}>
                  {statsLoading ? <Skeleton className="h-6 w-10" /> : value?.toLocaleString() ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Urgent storms */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-[hsl(0,72%,55%)]" />
              Urgent Right Now
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">These storms need hands today</p>
          </div>
          <Link href="/storms">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="link-see-all-storms">
              See all <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {stormsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : urgentStorms && urgentStorms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {urgentStorms.map(storm => <StormCard key={storm.id} storm={storm} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">No urgent storms at the moment.</p>
        )}
      </section>

      {/* How it works */}
      <section className="bg-muted/40 border-y border-border py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-xl font-bold mb-2">How a Love Storm works</h2>
          <p className="text-muted-foreground text-sm mb-10">Four steps from need to met.</p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "01", title: "Need is identified", body: "Someone in your community has a real need — a family crisis, a medical recovery, a sudden loss.", color: "bg-[hsl(226,52%,24%)]" },
              { n: "02", title: "A Steward steps up", body: "A trusted community leader creates a Storm — setting the scope, verifying the need, and inviting participation.", color: "bg-[hsl(15,75%,56%)]" },
              { n: "03", title: "Drops start falling", body: "Community members commit specific actions — meals, rides, time, money — one drop at a time.", color: "bg-[hsl(152,52%,44%)]" },
              { n: "04", title: "Need is met", body: "The Storm closes when the need is covered. The community sees the impact of collective action.", color: "bg-[hsl(43,86%,50%)]" },
            ].map(({ n, title, body, color }) => (
              <div key={n} className="flex flex-col gap-3">
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold font-display flex-shrink-0`}>{n}</div>
                <h3 className="font-display font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Heart size={32} className="text-[hsl(15,75%,56%)] mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold mb-3">Someone near you needs a storm.</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">Whether you have a need or a few hours to give, there's a place for you in Love Storm.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/request">
            <Button size="lg" className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-cta-request">
              I need help
            </Button>
          </Link>
          <Link href="/storms">
            <Button size="lg" variant="outline" data-testid="button-cta-give">
              I want to give
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
