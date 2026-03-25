import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import MatrixPage from "@/pages/matrix";
import NotFound from "@/pages/not-found";
import PasswordGate from "@/components/password-gate";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/matrix" component={MatrixPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PasswordGate>
          <Router />
        </PasswordGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
