"use client";

import React, { useState } from "react";
import {
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Hash,
  SlidersHorizontal,
  Sparkles,
  MessageSquare,
  Users,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";

interface SetupWidgetProps {
  setCurrentView: (view: string) => void;
}

export function SetupWidget({ setCurrentView }: SetupWidgetProps) {
  const { state, dismissSetupWidget } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  if (state.setupDismissed) return null;

  const completedCount = state.onboarding.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / state.onboarding.length) * 100);

  const getStepIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Hash className="w-3.5 h-3.5 text-purple-600" />;
      case 2:
        return <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />;
      case 3:
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 4:
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 5:
        return <Users className="w-3.5 h-3.5 text-orange-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const getStepBg = (id: number) => {
    switch (id) {
      case 1:
        return "bg-purple-100 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800";
      case 2:
        return "bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800";
      case 3:
        return "bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
      case 4:
        return "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
      case 5:
        return "bg-orange-100 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800";
      default:
        return "bg-primary/10 border-primary/20";
    }
  };

  const navigateToStep = (dest: string) => {
    if (dest.includes("hashtags/setup")) setCurrentView("hashtags_setup");
    else if (dest.includes("filters")) setCurrentView("filters");
    else if (dest.includes("hashtags/leads")) setCurrentView("hashtags_leads");
    else if (dest.includes("templates")) setCurrentView("templates");
    else if (dest.includes("competitors/setup")) setCurrentView("competitors_setup");
  };

  return (
    <div className="mb-6 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <Zap className="w-4 h-4 fill-amber-500/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Complete your setup</span>
              <span className="text-xs text-muted-foreground font-medium">
                {completedCount}/5 steps done ({percentage}%)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={dismissSetupWidget}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Dismiss checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Steps List */}
      {!collapsed && (
        <div className="divide-y divide-border/60">
          {state.onboarding.map((step) => (
            <div
              key={step.id}
              className={`p-3.5 px-4 flex items-center justify-between hover:bg-muted/30 transition-colors ${
                step.completed ? "opacity-75" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center ${getStepBg(step.id)}`}
                >
                  {getStepIcon(step.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${step.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {step.title}
                    </span>
                    {step.completed && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{step.helper}</p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => navigateToStep(step.destination)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 px-2.5 py-1 rounded hover:bg-primary/5 transition-colors"
                >
                  <span>{step.action}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
