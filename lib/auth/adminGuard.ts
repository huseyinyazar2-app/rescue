import { supabaseAdmin } from "@/lib/supabase/server";

export class AdminGuardError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AdminGuardError("Missing bearer token", 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new AdminGuardError("Invalid session", 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("rescue_profiles")
    .select("id, email, role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new AdminGuardError("Forbidden", 403);
  }

  return { user: data.user, profile };
}
