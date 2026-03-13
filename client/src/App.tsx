import { Switch, Route, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";

import Home from "@/pages/Home";
import StormDetail from "@/pages/StormDetail";
import StormFeed from "@/pages/StormFeed";
import RequestHelp from "@/pages/RequestHelp";
import StewardDashboard from "@/pages/StewardDashboard";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <Switch hook={useHashLocation}>
            <Route path="/" component={Home} />
            <Route path="/storms" component={StormFeed} />
            <Route path="/storms/:id" component={StormDetail} />
            <Route path="/request" component={RequestHelp} />
            <Route path="/steward" component={StewardDashboard} />
            {/* Default: redirect to home so empty hash still loads */}
            <Route><Redirect to="/" /></Route>
          </Switch>
        </AppShell>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
