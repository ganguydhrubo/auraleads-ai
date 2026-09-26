"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center space-y-4">
      <div className="w-14 h-14 rounded-xl bg-rose-500 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
        !
      </div>
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
