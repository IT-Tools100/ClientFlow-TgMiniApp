export interface TelegramWebAppUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  photo_url?: string;
}

export interface NormalizedTelegramUser {
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  languageCode: string | null;
  photoUrl: string | null;
  isDev: boolean;
}

interface TelegramWebApp {
  ready?: () => void;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const DEV_TELEGRAM_USER: NormalizedTelegramUser = {
  telegramId: "dev-clientflow-owner",
  username: "clientflow_dev",
  firstName: "ClientFlow",
  lastName: "Developer",
  languageCode: "en",
  photoUrl: null,
  isDev: true
};

function normalizeText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeTelegramUser(user: TelegramWebAppUser): NormalizedTelegramUser {
  return {
    telegramId: String(user.id),
    username: normalizeText(user.username),
    firstName: normalizeText(user.first_name),
    lastName: normalizeText(user.last_name),
    languageCode: normalizeText(user.language_code),
    photoUrl: normalizeText(user.photo_url),
    isDev: false
  };
}

export function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
}

export function getTelegramIdentity(): NormalizedTelegramUser {
  const webApp = getTelegramWebApp();
  webApp?.ready?.();

  const telegramUser = webApp?.initDataUnsafe?.user;
  if (telegramUser?.id) {
    return normalizeTelegramUser(telegramUser);
  }

  return DEV_TELEGRAM_USER;
}
