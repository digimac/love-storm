import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Zap, Heart, LayoutDashboard, HelpCircle, Home, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import PerplexityAttribution from "@/components/PerplexityAttribution";
import { useAuth } from "@/contexts/AuthContext";

const publicNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/storms", label: "Active Storms", icon: Zap },
  { href: "/request", label: "Request Help", icon: HelpCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { isSteward, logout } = useAuth();
  const [location] = useLocation(useHashLocation);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <svg aria-label="Love Storm logo" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 flex-shrink-0">
              {/* Heart shape with lightning bolt inside */}
              <path d="M18 30 C18 30 4 21 4 12 C4 7.6 7.6 4 12 4 C14.4 4 16.6 5.2 18 7.0 C19.4 5.2 21.6 4 24 4 C28.4 4 32 7.6 32 12 C32 21 18 30 18 30Z" fill="hsl(15 75% 56%)" opacity="0.9"/>
              <path d="M19.5 10 L15 18 L18.5 18 L16.5 26 L22 17 L18.5 17 L21 10Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-bold text-base tracking-tight leading-none">
              Love<span className="text-[hsl(15,75%,56%)]">Storm</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {publicNavItems.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href}>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                    <Icon size={14} />
                    {label}
                  </span>
                </Link>
              );
            })}
            {/* Steward nav — lock icon when logged out, dashboard when logged in */}
            {isSteward ? (
              <>
                <Link href="/steward">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    location === "/steward"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                    <LayoutDashboard size={14} />
                    Steward
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  data-testid="button-steward-logout"
                  title="Sign out of Steward view"
                >
                  <LogOut size={14} />
                </Button>
              </>
            ) : (
              <Link href="/steward/login">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  location === "/steward/login"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  <Lock size={14} />
                  Steward
                </span>
              </Link>
            )}
          </nav>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            data-testid="button-theme-toggle"
            className="h-8 w-8"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-border flex" aria-label="Mobile navigation">
          {publicNavItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href} className="flex-1">
                <span className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}>
                  <Icon size={16} />
                  {label}
                </span>
              </Link>
            );
          })}
          {/* Steward mobile nav */}
          {isSteward ? (
            <Link href="/steward" className="flex-1">
              <span className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                location === "/steward" ? "text-primary" : "text-muted-foreground"
              }`}>
                <LayoutDashboard size={16} />
                Steward
              </span>
            </Link>
          ) : (
            <Link href="/steward/login" className="flex-1">
              <span className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                location === "/steward/login" ? "text-primary" : "text-muted-foreground"
              }`}>
                <Lock size={16} />
                Steward
              </span>
            </Link>
          )}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-[hsl(15,75%,56%)]" />
            <span className="text-xs text-muted-foreground">Love Storm — Community Mobilization Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <PerplexityAttribution />
          </div>
        </div>
      </footer>
    </div>
  );
}
