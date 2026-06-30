interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  action?: string;
}

export function SectionHeader({ title, eyebrow, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 px-0.5">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-bold leading-tight text-white">{title}</h2>
      </div>
      {action ? (
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-app-muted">
          {action}
        </span>
      ) : null}
    </div>
  );
}
