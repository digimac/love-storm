import { Switch, Route, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Home from "@/pages/Home";
import StormDetail from "@/pages/StormDetail";
import StormFeed from "@/pages/StormFeed";
import RequestHelp from "@/pages/RequestHelp";
import StewardDashboard from "@/pages/StewardDashboard";
import StewardLogin from "@/pages/StewardLogin";
import StormReport from "@/pages/StormReport";
import SummaryReport from "@/pages/SummaryReport";
import NotFound from "@/pages/not-found";

// Guard: redirect to /steward/login unless authenticated
function ProtectedStewardRoute() {
  const { isSteward } = useAuth();
  if (!isSteward) return <Redirect to="/steward/login" />;
  return <StewardDashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppShell>
            <Switch hook={useHashLocation}>
              <Route path="/" component={Home} />
              <Route path="/storms" component={StormFeed} />
              <Route path="/storms/:id" component={StormDetail} />
              <Route path="/request" component={RequestHelp} />
              <Route path="/steward/login" component={StewardLogin} />
              <Route path="/steward" component={ProtectedStewardRoute} />
              <Route path="/storms/:id/report" component={StormReport} />
              <Route path="/report" component={SummaryReport} />
              {/* Default: redirect to home so empty hash still loads */}
              <Route><Redirect to="/" /></Route>
            </Switch>
          </AppShell>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
