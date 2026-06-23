import type { ClientStatus, DealStatus, TaskStatus } from "@/types";
import type { ReactNode } from "react";

type BadgeTone = "blue" | "cyan" | "purple" | "green" | "orange" | "red" | "slate";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  blue: "border-accent-blue/[0.38] bg-accent-blue/[0.16] text-blue-100 shadow-[0_0_22px_rgba(96,165,250,0.10)]",
  cyan: "border-accent-cyan/[0.38] bg-accent-cyan/[0.16] text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.10)]",
  purple: "border-accent-purple/[0.38] bg-accent-purple/[0.16] text-purple-50 shadow-[0_0_22px_rgba(167,139,250,0.10)]",
  green: "border-accent-green/[0.38] bg-accent-green/[0.16] text-emerald-50 shadow-[0_0_22px_rgba(52,211,153,0.10)]",
  orange: "border-accent-orange/[0.38] bg-accent-orange/[0.16] text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.10)]",
  red: "border-accent-red/[0.38] bg-accent-red/[0.16] text-rose-50 shadow-[0_0_22px_rgba(251,113,133,0.10)]",
  slate: "border-white/15 bg-white/[0.09] text-slate-100"
};

export function getStatusTone(status: ClientStatus | DealStatus | TaskStatus): BadgeTone {
  const tones: Record<ClientStatus | DealStatus | TaskStatus, BadgeTone> = {
    New: "blue",
    Contacted: "cyan",
    "In Progress": "purple",
    "Waiting Payment": "orange",
    Paid: "green",
    Lost: "red",
    Negotiation: "purple",
    Today: "cyan",
    Upcoming: "purple",
    Done: "green",
    Overdue: "red"
  };

  return tones[status] ?? "slate";
}

export function Badge({ children, tone = "slate", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
