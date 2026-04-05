import { requireAuth, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { UpdateProfileSchema } from "@/lib/validations/auth";

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const body: unknown = await request.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { error, data } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: auth.appUserId,
        display_name: parsed.data.display_name ?? "Player",
        ...parsed.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return fail("Failed to update profile", "DB_ERROR", 500);
  }

  return ok(data);
}
