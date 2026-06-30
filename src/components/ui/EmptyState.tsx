import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

interface EmptyStateProps {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
}

export function EmptyState({ actionLabel, description, onAction, title }: EmptyStateProps) {
  return (
    <GlassCard className="p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.09] text-sm font-bold text-accent-cyan shadow-glow">
        CF
      </div>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-[19rem] text-sm leading-6 text-app-muted">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-5 w-full" onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </GlassCard>
  );
}
