import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/security/ipHash";

const getRequestIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? "";
};

export const POST = async (request: NextRequest) => {
  const payload = await request.json();
  const publicCode = String(payload?.public_code ?? "").trim();
  const action = String(payload?.action ?? "").trim();
  const lat = typeof payload?.lat === "number" ? payload.lat : null;
  const lon = typeof payload?.lon === "number" ? payload.lon : null;
  const locationAccuracy = typeof payload?.location_accuracy_m === "number" ? payload.location_accuracy_m : null;
  const message = typeof payload?.message === "string" ? payload.message : null;

  if (!publicCode || !action) {
    return NextResponse.json({ message: "Eksik bilgi." }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const secret = process.env.IP_HASH_SECRET ?? "";
  const ipHash = ip ? hashIp(ip, secret) : null;
  const userAgent = request.headers.get("user-agent");
  const acceptLanguage = request.headers.get("accept-language");

  const serviceClient = createServiceRoleClient();

  const { data: tagRow } = await serviceClient
    .from("tags")
    .select("id")
    .eq("public_code", publicCode)
    .maybeSingle();

  const { data: petRow } = tagRow?.id
    ? await serviceClient.from("pets").select("id").eq("tag_id", tagRow.id).maybeSingle()
    : { data: null };

  await serviceClient.from("tag_scans").insert({
    public_code: publicCode,
    tag_id: tagRow?.id ?? null,
    pet_id: petRow?.id ?? null,
    action,
    lat,
    lon,
    location_accuracy_m: locationAccuracy,
    message,
    user_agent: userAgent,
    accept_language: acceptLanguage,
    ip_hash: ipHash,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
};
