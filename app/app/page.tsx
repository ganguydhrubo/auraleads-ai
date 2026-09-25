"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { SetupWidget } from "@/components/shell/SetupWidget";
import { ProductTour } from "@/components/shell/ProductTour";
import { SupportChat } from "@/components/shell/SupportChat";
import { Toast } from "@/components/shell/Toast";
import { HashtagsSetupView } from "@/components/pipeline/HashtagsSetupView";
import { HashtagsLeadsView } from "@/components/pipeline/HashtagsLeadsView";
import { CompetitorsSetupView } from "@/components/pipeline/CompetitorsSetupView";
import { CompetitorLeadsView } from "@/components/pipeline/CompetitorLeadsView";
import { FiltersView } from "@/components/pipeline/FiltersView";
import { MapsDiscoverView } from "@/components/maps/MapsDiscoverView";
import { MapsLeadsView } from "@/components/maps/MapsLeadsView";
import { InboxView } from "@/components/outreach/InboxView";
import { CampaignsView } from "@/components/outreach/CampaignsView";
import { TemplatesView } from "@/components/outreach/TemplatesView";
import { DashboardView } from "@/components/insights/DashboardView";
import { BillingView } from "@/components/account/BillingView";
import { SettingsView } from "@/components/account/SettingsView";
import { AdminView } from "@/components/account/AdminView";

export default function AppMainPage() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Determine whether to display the 5-step "Complete your setup" widget
  const showSetupWidget =
    currentView.startsWith("hashtags") ||
    currentView.startsWith("competitors") ||
    currentView === "filters" ||
    currentView.startsWith("maps") ||
    currentView === "inbox" ||
    currentView === "campaigns" ||
    currentView === "templates";

  const renderActiveView = () => {
    switch (currentView) {
      case "hashtags_setup":
        return <HashtagsSetupView setCurrentView={setCurrentView} />;
      case "hashtags_leads":
        return <HashtagsLeadsView setCurrentView={setCurrentView} />;
      case "competitors_setup":
        return <CompetitorsSetupView setCurrentView={setCurrentView} />;
      case "competitors_leads":
        return <CompetitorLeadsView setCurrentView={setCurrentView} />;
      case "filters":
        return <FiltersView />;
      case "maps_discover":
        return <MapsDiscoverView setCurrentView={setCurrentView} />;
      case "maps_leads":
        return <MapsLeadsView setCurrentView={setCurrentView} />;
      case "inbox":
        return <InboxView setCurrentView={setCurrentView} />;
      case "campaigns":
        return <CampaignsView setCurrentView={setCurrentView} />;
      case "templates":
        return <TemplatesView />;
      case "dashboard":
        return <DashboardView />;
      case "billing":
        return <BillingView />;
      case "settings":
        return <SettingsView />;
      case "admin":
        return <AdminView />;
      default:
        return <HashtagsSetupView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* 3-Tier Collapsible Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} collapsed={collapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar currentView={currentView} collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Global Onboarding Banner (shown on discover & outreach until dismissed) */}
          {showSetupWidget && <SetupWidget setCurrentView={setCurrentView} />}

          {/* Active View Container */}
          {renderActiveView()}
        </main>
      </div>

      {/* 15-Step Interactive Product Tour Modal */}
      <ProductTour />

      {/* Floating Bottom-Right Support Chat Panel */}
      <SupportChat />

      {/* Non-blocking notifications — never use native alert()/confirm() here */}
      <Toast />
    </div>
  );
}
