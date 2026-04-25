import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Players from "./pages/Players";
import Ranking from "./pages/Ranking";
import Champions from "./pages/Champions";
import Matches from "./pages/Matches";
import Sync from "./pages/Sync";
import PlayerDetail from "./pages/PlayerDetail";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/players"} component={Players} />
        <Route path={"/ranking"} component={Ranking} />
        <Route path={"/champions"} component={Champions} />
        <Route path={"/matches"} component={Matches} />
        <Route path={"/sync"} component={Sync} />
        <Route path={"/player/:name"} component={PlayerDetail} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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
