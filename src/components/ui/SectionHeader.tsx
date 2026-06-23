interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  action?: string;
}

export function SectionHeader({ title, eyebrow, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {action ? <span className="text-xs font-semibold text-app-muted">{action}</span> : null}
    </div>
  );
}
