import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface PlaceholderScreenProps {
  title: string;
  description: string;
  highlights: string[];
}

export function PlaceholderScreen({ title, description, highlights }: PlaceholderScreenProps) {
  return (
    <section className="space-y-4">
      <SectionHeader eyebrow="Следующий модуль" title={title} />
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-purple/20 blur-2xl" />
        <p className="text-sm leading-6 text-app-muted">{description}</p>
        <div className="mt-5 space-y-2">
          {highlights.map((item) => (
            <div
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3"
              key={item}
            >
              <span className="text-sm font-medium text-white">{item}</span>
              <span className="text-xs font-semibold text-accent-cyan">Скоро</span>
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full" variant="secondary">
          Интерфейс готов
        </Button>
      </GlassCard>
    </section>
  );
}
