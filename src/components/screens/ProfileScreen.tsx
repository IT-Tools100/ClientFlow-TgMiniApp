import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

const stack = ["Next.js", "TypeScript", "Tailwind CSS", "Mock state"];
const settings = ["Dark liquid glass theme", "USD currency placeholder", "Local demo data"];

export function ProfileScreen() {
  return (
    <section className="space-y-6">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-purple/20 blur-2xl" />
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/15 bg-white/[0.1] text-lg font-bold text-white shadow-glow">
            DU
          </div>
          <div className="min-w-0">
            <p className="text-sm text-app-muted">Demo user</p>
            <h2 className="truncate text-2xl font-bold text-white">ClientFlow Owner</h2>
            <div className="mt-2">
              <Badge tone="cyan">Telegram Mini App mode: Demo</Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      <section>
        <SectionHeader eyebrow="Project" title="ClientFlow Mini App" />
        <GlassCard className="p-4">
          <p className="text-sm leading-6 text-app-muted">
            Mobile-first CRM concept for clients, tasks, and deals. This stage keeps everything in
            live Supabase database state for clients, tasks, deals, and activities.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <InfoTile label="Version" value="0.4 demo" />
            <InfoTile label="Data mode" value="Mock state" />
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Stack" title="Tech stack" />
        <GlassCard className="p-4">
          <div className="flex flex-wrap gap-2">
            {stack.map((item) => (
              <Badge key={item} tone="slate">
                {item}
              </Badge>
            ))}
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Settings" title="App settings" />
        <GlassCard className="p-4">
          <div className="space-y-3">
            {settings.map((item) => (
              <div
                className="flex min-h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.07] px-3"
                key={item}
              >
                <span className="text-sm font-medium text-white">{item}</span>
                <span className="text-xs font-semibold text-app-muted">Soon</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
      <p className="text-[11px] text-app-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
