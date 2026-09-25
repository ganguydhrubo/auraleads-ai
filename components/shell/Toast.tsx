"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/store/app-store";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-medium animate-in slide-in-from-bottom-3 ${
          toast.tone === "error"
            ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
            : "bg-card border-border text-foreground"
        }`}
      >
        {toast.tone === "error" ? (
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
