import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function GlassCard({ children, className = "", interactive = false, ...props }: GlassCardProps) {
  return (
    <div
      className={`glass-panel card-enter rounded-[26px] ${
        interactive ? "hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09]" : ""
      } ${className}`}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
