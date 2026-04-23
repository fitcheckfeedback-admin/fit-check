import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useEffect } from "react";
import { trackEvent, trackPageView } from "@/lib/analytics";
import { useLocation } from "wouter";

// Pages
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Forecast from "@/pages/Forecast";
import Style from "@/pages/Style";
import Closet from "@/pages/Closet";
import Settings from "@/pages/Settings";
import Reminders from "@/pages/Reminders";
import Analytics from "@/pages/Analytics";
import Cam from "@/pages/Cam";
import Trip from "@/pages/Trip";
import NotFound from "@/pages/not-found";
import VideoTemplate from "@/components/video/VideoTemplate";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, hideNav, ...rest }: any) {
  const { settings } = useFitCheckSettings();
  const [pathname] = useLocation();

  useEffect(() => {
    if (settings.onboarded) {
      trackPageView(pathname || "/");
    }
  }, [pathname, settings.onboarded]);

  if (!settings.onboarded) {
    return <Redirect to="/onboarding" />;
  }

  return (
    <AppShell hideNav={hideNav}>
      <Component {...rest} />
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/video-tour" component={VideoTemplate} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/forecast" component={() => <ProtectedRoute component={Forecast} />} />
      <Route path="/style" component={() => <ProtectedRoute component={Style} />} />
      <Route path="/closet" component={() => <ProtectedRoute component={Closet} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/reminders" component={() => <ProtectedRoute component={Reminders} />} />
      <Route path="/cam" component={() => <ProtectedRoute component={Cam} hideNav />} />
      <Route path="/trip" component={() => <ProtectedRoute component={Trip} />} />
      <Route path="/analytics" component={Analytics} />
      <Route component={() => (
        <AppShell hideNav>
          <NotFound />
        </AppShell>
      )} />
    </Switch>
  );
}

function AppTracker() {
  useEffect(() => {
    const key = "fitcheck.sessionTracked";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      trackEvent("app_open", {
        referrer: document.referrer || undefined,
      });
    }
  }, []);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppTracker />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
