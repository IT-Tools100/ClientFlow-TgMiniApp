import { GlassCard } from "@/components/ui/GlassCard";

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "cyan" | "purple" | "green";
}

const tones = {
  blue: "from-accent-blue/[0.36] to-accent-blue/0",
  cyan: "from-accent-cyan/[0.36] to-accent-cyan/0",
  purple: "from-accent-purple/[0.36] to-accent-purple/0",
  green: "from-accent-green/[0.36] to-accent-green/0"
};

export function StatCard({ label, value, detail, tone = "blue" }: StatCardProps) {
  return (
    <GlassCard className="min-h-32 p-4">
      <div
        className={`pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br ${tones[tone]} blur-2xl`}
      />
      <p className="text-xs font-medium text-app-muted">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-300">{detail}</p>
    </GlassCard>
  );
}
