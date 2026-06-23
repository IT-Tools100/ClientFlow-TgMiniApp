import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function GlassCard({ children, className = "", ...props }: GlassCardProps) {
  return (
    <div className={`glass-panel card-enter rounded-[28px] ${className}`} {...props}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
