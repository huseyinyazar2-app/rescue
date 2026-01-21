import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/security/ipHash";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EVENT_TYPES = ["seen", "found", "info"] as const;

const getRequestIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? "";
};

export const POST = async (request: NextRequest) => {
  const formData = await request.formData();
  const publicCode = String(formData.get("public_code") ?? "").trim();
  const rawEventType = String(formData.get("event_type") ?? "").trim();
  const eventType = (ALLOWED_EVENT_TYPES.includes(rawEventType as (typeof ALLOWED_EVENT_TYPES)[number])
    ? rawEventType
    : "seen") as (typeof ALLOWED_EVENT_TYPES)[number];
  const message = String(formData.get("message") ?? "").trim() || null;
  const finderContact = String(formData.get("finder_contact") ?? "").trim() || null;
  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lon = formData.get("lon") ? Number(formData.get("lon")) : null;
  const locationAccuracy = formData.get("location_accuracy_m") ? Number(formData.get("location_accuracy_m")) : null;

  if (!publicCode) {
    return NextResponse.json({ message: "Etiket kodu eksik." }, { status: 400 });
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

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await serviceClient
    .from("tag_scans")
    .select("id", { count: "exact", head: true })
    .eq("public_code", publicCode)
    .eq("ip_hash", ipHash)
    .gte("created_at", fiveMinutesAgo)
    .in("action", ["report_submitted", "report_failed"]);

  if (count && count >= 3) {
    await serviceClient.from("tag_scans").insert({
      public_code: publicCode,
      tag_id: tagRow?.id ?? null,
      pet_id: petRow?.id ?? null,
      action: "report_failed",
      lat,
      lon,
      location_accuracy_m: locationAccuracy,
      message,
      user_agent: userAgent,
      accept_language: acceptLanguage,
      ip_hash: ipHash,
      metadata: { reason: "rate_limited" },
    });

    return NextResponse.json(
      { message: "Çok fazla gönderim yaptınız. Lütfen birkaç dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const photo = formData.get("photo");
  let photoUrl: string | null = null;

  if (photo instanceof File) {
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "Fotoğraf boyutu 5MB sınırını aşıyor." }, { status: 400 });
    }

    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ message: "Sadece görsel dosyalar yüklenebilir." }, { status: 400 });
    }

    const extension = photo.name.split(".").pop() ?? "jpg";
    const fileName = `${randomUUID()}.${extension}`;
    const buffer = new Uint8Array(await photo.arrayBuffer());

    const { error } = await serviceClient.storage
      .from("sightings-photos")
      .upload(fileName, buffer, { contentType: photo.type, upsert: false });

    if (error) {
      return NextResponse.json({ message: "Fotoğraf yüklenemedi." }, { status: 500 });
    }

    const { data: publicUrl } = serviceClient.storage.from("sightings-photos").getPublicUrl(fileName);
    photoUrl = publicUrl.publicUrl;
  }

  if (petRow?.id) {
    const { error } = await serviceClient.from("sightings").insert({
      pet_id: petRow.id,
      lat,
      lon,
      location_accuracy_m: locationAccuracy,
      message,
      photo_url: photoUrl,
      finder_contact: finderContact,
      ip_hash: ipHash,
      metadata: {
        user_agent: userAgent,
        accept_language: acceptLanguage,
        page: "c",
        event_type: eventType,
      },
      is_suspected_spam: false,
      event_type: eventType,
    });

    if (error) {
      await serviceClient.from("tag_scans").insert({
        public_code: publicCode,
        tag_id: tagRow?.id ?? null,
        pet_id: petRow.id,
        action: "report_failed",
        lat,
        lon,
        location_accuracy_m: locationAccuracy,
        message,
        user_agent: userAgent,
        accept_language: acceptLanguage,
        ip_hash: ipHash,
        metadata: { reason: "sighting_insert_failed" },
      });

      return NextResponse.json({ message: "Bildirim kaydedilemedi." }, { status: 500 });
    }

    await serviceClient.from("tag_scans").insert({
      public_code: publicCode,
      tag_id: tagRow?.id ?? null,
      pet_id: petRow.id,
      action: "report_submitted",
      lat,
      lon,
      location_accuracy_m: locationAccuracy,
      message,
      user_agent: userAgent,
      accept_language: acceptLanguage,
      ip_hash: ipHash,
    });

    return NextResponse.json({ message: "Teşekkürler! Bilgileriniz sahibine iletilecek." }, { status: 200 });
  }

  await serviceClient.from("tag_scans").insert({
    public_code: publicCode,
    tag_id: tagRow?.id ?? null,
    pet_id: null,
    action: "report_submitted",
    lat,
    lon,
    location_accuracy_m: locationAccuracy,
    message,
    user_agent: userAgent,
    accept_language: acceptLanguage,
    ip_hash: ipHash,
    metadata: { note: "tag_not_activated" },
  });

  return NextResponse.json(
    { message: "Etiket aktif değil ama paylaştığınız bilgi kaydedildi. Teşekkürler!" },
    { status: 200 }
  );
};
