import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { NormalizedTelegramUser } from "@/lib/telegram";
import { labels } from "@/lib/labels";
import type { Activity, Client, Deal, Profile, Task } from "@/types";

const APP_VERSION = "0.1.0";
const notAvailable = labels.common.notAvailable;

interface ProfileScreenProps {
  activities: Activity[];
  clients: Client[];
  currentProfile: Profile | null;
  deals: Deal[];
  tasks: Task[];
  telegramUser: NormalizedTelegramUser | null;
}

function profileValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || notAvailable;
}

function getInitials(profile: Profile | null, telegramUser: NormalizedTelegramUser | null) {
  const first = profile?.firstName?.[0] ?? telegramUser?.firstName?.[0] ?? profile?.username?.[0] ?? "C";
  const last = profile?.lastName?.[0] ?? telegramUser?.lastName?.[0] ?? "F";

  return `${first}${last}`.toUpperCase();
}

function getDisplayName(profile: Profile | null) {
  if (!profile) {
    return "Рабочее пространство";
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  return fullName || profile.username || "Рабочее пространство";
}

function getConnectionTone(isConnected: boolean) {
  return isConnected ? "green" : "red";
}

export function ProfileScreen({
  activities,
  clients,
  currentProfile,
  deals,
  tasks,
  telegramUser
}: ProfileScreenProps) {
  const avatarUrl = currentProfile?.photoUrl ?? telegramUser?.photoUrl ?? null;
  const isSupabaseConnected = Boolean(currentProfile?.id);
  const isTelegramConnected = Boolean(telegramUser && !telegramUser.isDev);
  const isProfileLoaded = Boolean(currentProfile?.id);

  if (!currentProfile) {
    return (
      <section className="space-y-6">
        <EmptyState
          description="Данные профиля не загружены. Повторите загрузку приложения, чтобы восстановить настройки."
          title="Профиль не загружен"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-purple/20 blur-2xl" />
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.1] bg-cover bg-center text-lg font-bold text-white shadow-glow"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
          >
            {avatarUrl ? (
              <span className="sr-only">Аватар Telegram</span>
            ) : (
              getInitials(currentProfile, telegramUser)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-app-muted">Профиль workspace</p>
            <h2 className="truncate text-2xl font-bold text-white">
              {getDisplayName(currentProfile)}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="cyan">
                {telegramUser?.isDev ? "Dev identity" : "Telegram Mini App"}
              </Badge>
              <Badge tone={getConnectionTone(isProfileLoaded)}>Профиль загружен</Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      <section>
        <SectionHeader eyebrow="Рабочее пространство" title="Профиль" />
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Имя" value={profileValue(currentProfile.firstName)} />
            <InfoTile label="Фамилия" value={profileValue(currentProfile.lastName)} />
            <InfoTile label="Username" value={profileValue(currentProfile.username)} />
            <InfoTile label="Telegram ID" value={profileValue(currentProfile.telegramId)} />
            <InfoTile className="col-span-2" label="Profile ID" value={currentProfile.id} />
            <InfoTile
              className="col-span-2"
              label="Дата регистрации"
              value={profileValue(currentProfile.createdAt)}
            />
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Рабочее пространство" title="Статистика" />
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Клиенты" value={String(clients.length)} />
            <InfoTile label="Сделки" value={String(deals.length)} />
            <InfoTile label="Задачи" value={String(tasks.length)} />
            <InfoTile label="Действия" value={String(activities.length)} />
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Настройки" title="Внешний вид" />
        <GlassCard className="p-4">
          <div className="space-y-3">
            <SettingRow label="Тема" meta="Текущая" value="Темная" />
            <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-3">
              <div>
                <p className="text-sm font-medium text-white">Светлая тема</p>
                <p className="mt-1 text-xs text-app-muted">Скоро</p>
              </div>
              <button
                aria-label="Светлая тема скоро"
                className="h-7 w-12 rounded-full border border-white/10 bg-white/[0.08] p-1 opacity-60"
                disabled
                type="button"
              >
                <span className="block h-5 w-5 rounded-full bg-white/35" />
              </button>
            </div>
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Настройки" title="Язык" />
        <GlassCard className="p-4">
          <div className="space-y-3">
            <SettingRow label="English" meta="Текущий" value="Включен" />
            <SettingRow label="Russian" meta="Скоро" value="Отключен" />
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Система" title="Статус подключения" />
        <GlassCard className="p-4">
          <div className="space-y-3">
            <ConnectionRow
              detail="Профиль загружен из состояния Supabase"
              isConnected={isSupabaseConnected}
              label="Supabase"
            />
            <ConnectionRow
              detail={telegramUser?.isDev ? "Активна dev identity" : "Telegram WebApp identity"}
              isConnected={isTelegramConnected}
              label="Telegram"
            />
            <ConnectionRow
              detail="currentProfile.id доступен"
              isConnected={isProfileLoaded}
              label="Профиль загружен"
            />
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Система" title="Информация о данных" />
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 gap-2">
            <InfoTile label="Profile ID" value={currentProfile.id} />
            <InfoTile label="Telegram ID" value={profileValue(currentProfile.telegramId)} />
            <InfoTile label="Владение данными" value="currentProfile.id активен" />
            <InfoTile
              label="Статус базы"
              value={isSupabaseConnected ? "Подключено" : "Отключено"}
            />
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="О продукте" title="ClientFlow" />
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Приложение" value="ClientFlow" />
            <InfoTile label="Версия" value={APP_VERSION} />
            <InfoTile label="Build" value={notAvailable} />
            <InfoTile label="Режим" value="Telegram Mini App" />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-app-muted">Работает на</p>
            <div className="flex flex-wrap gap-2">
              {["Next.js", "Supabase", "Telegram Mini Apps"].map((item) => (
                <Badge key={item} tone="slate">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Опасная зона" title="Удаление" />
        <GlassCard className="border-accent-red/25 p-4">
          <p className="text-sm font-semibold text-white">Удалить рабочее пространство</p>
          <p className="mt-1 text-sm text-app-muted">Скоро</p>
          <Button className="mt-4 w-full" disabled variant="ghost">
            Удалить рабочее пространство
          </Button>
        </GlassCard>
      </section>
    </section>
  );
}

function ConnectionRow({
  detail,
  isConnected,
  label
}: {
  detail: string;
  isConnected: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 text-xs text-app-muted">{detail}</p>
      </div>
      <Badge tone={getConnectionTone(isConnected)}>
        {isConnected ? "Подключено" : "Отключено"}
      </Badge>
    </div>
  );
}

function InfoTile({
  className = "",
  label,
  value
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-3 ${className}`}>
      <p className="text-[11px] text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SettingRow({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 text-xs text-app-muted">{meta}</p>
      </div>
      <span className="text-xs font-semibold text-app-muted">{value}</span>
    </div>
  );
}
