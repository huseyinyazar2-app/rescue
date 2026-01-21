import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { createAnonClient, createServiceRoleClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/security/ipHash";
import { FinderForm } from "./FinderForm";

type FinderPageProps = {
  publicCode: string;
  defaultEventType: "seen" | "found" | "info";
};

type PublicPetInfo = {
  is_activated: boolean;
  pet_id: string | null;
  pet_name: string | null;
  species: string | null;
  photo_url: string | null;
  pet_status: string | null;
  last_seen_area: string | null;
};

const getRequestIp = (headerList: Headers) => {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }
  return headerList.get("x-real-ip") ?? "";
};

const logView = async (publicCode: string, petId: string | null) => {
  const headerList = headers();
  const ip = getRequestIp(headerList);
  const userAgent = headerList.get("user-agent");
  const acceptLanguage = headerList.get("accept-language");
  const secret = process.env.IP_HASH_SECRET ?? "";
  const ipHash = ip ? hashIp(ip, secret) : null;

  const serviceClient = createServiceRoleClient();
  const { data: tagRow } = await serviceClient
    .from("tags")
    .select("id")
    .eq("public_code", publicCode)
    .maybeSingle();

  await serviceClient.from("tag_scans").insert({
    public_code: publicCode,
    tag_id: tagRow?.id ?? null,
    pet_id: petId,
    action: "view",
    user_agent: userAgent,
    accept_language: acceptLanguage,
    ip_hash: ipHash,
  });
};

export const FinderPage = async ({ publicCode, defaultEventType }: FinderPageProps) => {
  const anonClient = createAnonClient();
  const { data } = await anonClient.rpc("get_public_pet_by_code", {
    input_public_code: publicCode,
  });

  const petInfo = (data?.[0] ?? null) as PublicPetInfo | null;
  await logView(publicCode, petInfo?.pet_id ?? null);

  const isActivated = petInfo?.is_activated ?? false;
  const isLost = petInfo?.pet_status === "lost";
  const resolvedEventType =
    !isLost && defaultEventType !== "found" ? "info" : defaultEventType;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">MatrixC Rescue</p>
            <Link href="/privacy" className="text-xs font-medium text-slate-500 underline">
              Aydınlatma
            </Link>
          </div>
          {!isActivated && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Bu etiket henüz aktif değil.</p>
              <p className="mt-1">
                Lütfen en yakın veteriner veya petshop’a götürün. Yine de konum ve not paylaşabilirsiniz.
              </p>
            </div>
          )}
          {isLost && (
            <div className="inline-flex w-fit items-center rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold text-rose-700">
              KAYIP
            </div>
          )}
          {petInfo?.pet_name && (
            <h1 className="text-2xl font-semibold text-slate-900">{petInfo.pet_name}</h1>
          )}
          {petInfo?.species && <p className="text-sm text-slate-600">Tür: {petInfo.species}</p>}
          {petInfo?.last_seen_area && (
            <p className="text-sm text-slate-600">Son görüldüğü yer: {petInfo.last_seen_area}</p>
          )}
          {petInfo?.photo_url && (
            <div className="relative h-56 w-full overflow-hidden rounded-2xl">
              <Image src={petInfo.photo_url} alt={petInfo.pet_name ?? "Pet"} fill className="object-cover" />
            </div>
          )}
          {!isLost && isActivated && (
            <p className="text-sm text-slate-600">
              Bu hayvan kayıp olarak işaretlenmemiş. Yine de bilgi gönderebilirsiniz.
            </p>
          )}
        </header>

        <FinderForm publicCode={publicCode} defaultEventType={resolvedEventType} petInfo={petInfo} />
      </div>
    </main>
  );
};
