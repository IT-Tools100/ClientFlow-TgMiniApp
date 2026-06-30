import type { ClientStatus, DealStatus, TaskStatus } from "@/types";
import type { ReactNode } from "react";

type BadgeTone = "blue" | "cyan" | "purple" | "green" | "orange" | "red" | "slate";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  blue: "border-accent-blue/[0.36] bg-accent-blue/[0.14] text-blue-100 shadow-[0_0_22px_rgba(96,165,250,0.08)]",
  cyan: "border-accent-cyan/[0.36] bg-accent-cyan/[0.14] text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.08)]",
  purple: "border-accent-purple/[0.36] bg-accent-purple/[0.14] text-purple-50 shadow-[0_0_22px_rgba(167,139,250,0.08)]",
  green: "border-accent-green/[0.36] bg-accent-green/[0.14] text-emerald-50 shadow-[0_0_22px_rgba(52,211,153,0.08)]",
  orange: "border-accent-orange/[0.36] bg-accent-orange/[0.14] text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.08)]",
  red: "border-accent-red/[0.36] bg-accent-red/[0.14] text-rose-50 shadow-[0_0_22px_rgba(251,113,133,0.08)]",
  slate: "border-white/14 bg-white/[0.08] text-slate-100"
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
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-normal backdrop-blur ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
