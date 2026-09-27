import Link from "next/link";
import { LogoMark } from "@/components/shell/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center space-y-4">
      <LogoMark className="w-14 h-14" />
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        Back to AuraLeads AI
      </Link>
    </div>
  );
}
