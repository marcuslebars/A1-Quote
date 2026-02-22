import { Route, Switch } from "wouter";
import Home from "@/pages/Home";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <a href="/" className="text-primary hover:underline">
              Return to Quote Form
            </a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}
