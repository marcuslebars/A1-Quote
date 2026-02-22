import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminQuotes from "@/pages/AdminQuotes";
import NotFound from "@/pages/NotFound";

function Router() {
  // Admin deployment: redirect homepage to admin dashboard
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/admin/quotes" />
      </Route>
      <Route path="/admin/quotes" component={AdminQuotes} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
