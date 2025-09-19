import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Candidates from "@/pages/candidates";
import Interviews from "@/pages/interviews";
import Recordings from "@/pages/recordings";
import Analytics from "@/pages/analytics";
import Scheduling from "@/pages/scheduling";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/candidates" component={Candidates} />
          <Route path="/interviews" component={Interviews} />
          <Route path="/recordings" component={Recordings} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/scheduling" component={Scheduling} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
