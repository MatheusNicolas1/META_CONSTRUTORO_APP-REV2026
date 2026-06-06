import { supabase } from "@/integrations/supabase/client";

export type PersistedTheme = "light" | "dark";

export const normalizePersistedTheme = (
  theme: string | null | undefined,
): PersistedTheme => (theme === "dark" ? "dark" : "light");

export const resolvePersistedTheme = (
  theme: string | null | undefined,
  systemTheme?: PersistedTheme,
): PersistedTheme =>
  theme === "system" ? systemTheme || "light" : normalizePersistedTheme(theme);

export const persistUserThemePreference = async (
  userId: string,
  theme: PersistedTheme,
) => {
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        theme,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  if (error) {
    throw error;
  }
};
