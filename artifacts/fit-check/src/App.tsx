import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";

// Pages
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Forecast from "@/pages/Forecast";
import Style from "@/pages/Style";
import Closet from "@/pages/Closet";
import Settings from "@/pages/Settings";
import Reminders from "@/pages/Reminders";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { settings } = useFitCheckSettings();
  
  if (!settings.onboarded) {
    return <Redirect to="/onboarding" />;
  }

  return (
    <AppShell>
      <Component {...rest} />
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/forecast" component={() => <ProtectedRoute component={Forecast} />} />
      <Route path="/style" component={() => <ProtectedRoute component={Style} />} />
      <Route path="/closet" component={() => <ProtectedRoute component={Closet} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/reminders" component={() => <ProtectedRoute component={Reminders} />} />
      <Route component={() => (
        <AppShell hideNav>
          <NotFound />
        </AppShell>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
