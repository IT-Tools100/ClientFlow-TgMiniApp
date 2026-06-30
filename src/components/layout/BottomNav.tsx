import type { NavTab } from "@/types";
import { labels } from "@/lib/labels";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const navItems: Array<{ id: NavTab; label: string; mark: string }> = [
  { id: "dashboard", label: labels.nav.dashboard, mark: "01" },
  { id: "clients", label: labels.nav.clients, mark: "02" },
  { id: "tasks", label: labels.nav.tasks, mark: "03" },
  { id: "deals", label: labels.nav.deals, mark: "04" },
  { id: "analytics", label: labels.nav.analytics, mark: "05" },
  { id: "profile", label: labels.nav.profile, mark: "06" }
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-4">
      <div className="glass-panel grid grid-cols-6 rounded-[28px] p-2 shadow-[0_-18px_80px_rgba(34,211,238,0.08)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={`tap-highlight relative flex min-h-[60px] flex-col items-center justify-center rounded-2xl text-[10px] font-semibold transition active:scale-95 ${
                isActive
                  ? "bg-white text-slate-950 shadow-[0_12px_34px_rgba(96,165,250,0.28)]"
                  : "text-app-muted hover:bg-white/10 hover:text-white"
              }`}
              key={item.id}
              onClick={() => onTabChange(item.id)}
              type="button"
            >
              {isActive ? (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-accent-cyan shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
              ) : null}
              <span className="text-[11px] leading-none">{item.mark}</span>
              <span className="mt-1 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
