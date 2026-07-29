import { Routes, Route, Link } from "react-router-dom";
import Index from "./routes/index";
import Join from "./routes/join";
import Lobby from "./routes/lobby";
import Game from "./routes/game";
import Organizer from "./routes/organizer";
import Settings from "./routes/settings";
import Winners from "./routes/winners";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/join" element={<Join />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game" element={<Game />} />
      <Route path="/organizer" element={<Organizer />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/winners" element={<Winners />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}