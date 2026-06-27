import { requireSupabaseClient, throwSupabaseError } from "@/lib/services/shared";
import type { NormalizedTelegramUser } from "@/lib/telegram";
import type { Profile } from "@/types";
import type { ProfileRow } from "@/types/database";

function mapRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    telegramId: row.telegram_id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    languageCode: row.language_code,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function profilePayload(user: NormalizedTelegramUser) {
  return {
    telegram_id: user.telegramId,
    username: user.username,
    first_name: user.firstName,
    last_name: user.lastName,
    language_code: user.languageCode,
    photo_url: user.photoUrl
  };
}

function shouldUpdateProfile(profile: ProfileRow, user: NormalizedTelegramUser) {
  return (
    profile.username !== user.username ||
    profile.first_name !== user.firstName ||
    profile.last_name !== user.lastName ||
    profile.language_code !== user.languageCode ||
    profile.photo_url !== user.photoUrl
  );
}

export async function getOrCreateProfile(user: NormalizedTelegramUser): Promise<Profile> {
  const supabase = requireSupabaseClient();

  try {
    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("telegram_id", user.telegramId)
      .maybeSingle();

    if (selectError) {
      throwSupabaseError("profiles", "select", selectError);
    }

    if (existingProfile) {
      if (!shouldUpdateProfile(existingProfile, user)) {
        return mapRowToProfile(existingProfile);
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(profilePayload(user))
        .eq("id", existingProfile.id)
        .select("*")
        .single();

      if (updateError || !updatedProfile) {
        throwSupabaseError("profiles", "update", updateError);
      }

      return mapRowToProfile(updatedProfile);
    }

    const { data: createdProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(profilePayload(user))
      .select("*")
      .single();

    if (insertError || !createdProfile) {
      throwSupabaseError("profiles", "insert", insertError);
    }

    return mapRowToProfile(createdProfile);
  } catch (error) {
    throwSupabaseError("profiles", "getOrCreate", error);
  }
}
