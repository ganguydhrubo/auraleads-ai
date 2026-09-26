import type { SVGProps } from "react";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}>
      <rect width="40" height="40" rx="11" fill="hsl(var(--primary))" />
      <path d="M9 27.5 18.3 12h5.4l-9.3 15.5H9Z" fill="white" />
      <path d="m18.2 27.5 9.3-15.5H33l-9.3 15.5h-5.5Z" fill="white" opacity=".82" />
      <path d="M23.4 28.5h8.5" stroke="#55D6AF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`} aria-label="AuraLeads AI">
      <LogoMark className="h-9 w-9 shrink-0" />
      {!compact && (
        <span className="whitespace-nowrap text-[17px] font-bold tracking-[-0.055em] text-foreground leading-none">
          AuraLeads<span className="ml-1 text-[10px] font-bold tracking-[0.08em] text-primary align-middle">AI</span>
        </span>
      )}
    </span>
  );
}
