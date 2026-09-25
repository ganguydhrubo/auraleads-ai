import { AppProvider } from "@/lib/store/app-store";

// Everything under /app is a live, per-user authenticated dashboard backed by
// a Supabase session — never statically prerendered.
export const dynamic = "force-dynamic";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
