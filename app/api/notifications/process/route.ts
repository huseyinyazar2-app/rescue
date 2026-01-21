import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
const cronSecret = process.env.NOTIFICATIONS_CRON_SECRET;
const emailProvider = process.env.EMAIL_PROVIDER;
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;

type NotificationEvent = {
  id: string;
  event_type: 'PET_LOST_PUBLIC' | 'PET_FOUND_PUBLIC';
  pet_id: string;
};

type PetRecord = {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
  last_seen_area: string | null;
  last_seen_lat: number | null;
  last_seen_lon: number | null;
  last_seen_radius_km: number | null;
  public_blurb: string | null;
  tag: { public_code: string } | null;
};

type Subscription = {
  id: string;
  user_id: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  species_filter: string[];
  notify_lost: boolean;
  notify_found: boolean;
  is_enabled: boolean;
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

const buildEmailBody = (pet: PetRecord) => {
  const lostUrl = `${baseUrl}/lost/${pet.tag?.public_code ?? ''}`;
  const sawUrl = `${baseUrl}/c/${pet.tag?.public_code ?? ''}`;
  const foundUrl = `${baseUrl}/found/${pet.tag?.public_code ?? ''}`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#0f172a;">Yakınınızda kayıp ilanı var</h2>
      ${
        pet.photo_url
          ? `<img src="${pet.photo_url}" alt="Kayıp ilan" style="width:100%;border-radius:16px;" />`
          : ''
      }
      <p><strong>Tür:</strong> ${pet.species}</p>
      <p><strong>Son görülen bölge:</strong> ${pet.last_seen_area ?? 'Paylaşılmadı'}</p>
      <p>${pet.public_blurb ?? ''}</p>
      <p><a href="${lostUrl}">İlan detayları</a></p>
      <div style="margin-top:16px;">
        <a href="${sawUrl}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;margin-right:8px;">Gördüm</a>
        <a href="${foundUrl}" style="display:inline-block;padding:10px 16px;border:1px solid #cbd5f5;color:#0f172a;border-radius:8px;text-decoration:none;">Buldum</a>
      </div>
      <p style="margin-top:16px;color:#64748b;font-size:12px;">Tam adres paylaşılmıyor, yalnızca yaklaşık bölge iletilir.</p>
    </div>
  `;
};

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!emailProvider || emailProvider !== 'resend') {
    return { status: 'skipped' as const };
  }

  if (!resendApiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or FROM_EMAIL');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return { status: 'sent' as const };
};

export async function POST(request: Request) {
  if (cronSecret) {
    const provided = request.headers.get('x-cron-secret');
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { data: events, error } = await supabaseServer
    .from('rescue_notification_events')
    .select('id,event_type,pet_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [] as Array<{ event_id: string; outbox_count: number }>;

  for (const event of (events ?? []) as NotificationEvent[]) {
    const { data: pet, error: petError } = await supabaseServer
      .from('rescue_pets')
      .select(
        'id,name,species,photo_url,last_seen_area,last_seen_lat,last_seen_lon,last_seen_radius_km,public_blurb,tag:rescue_tags(public_code)',
      )
      .eq('id', event.pet_id)
      .single();

    if (petError || !pet) {
      await supabaseServer
        .from('rescue_notification_events')
        .update({ status: 'failed', error: petError?.message ?? 'Pet not found' })
        .eq('id', event.id);
      continue;
    }

    if (!pet.last_seen_lat || !pet.last_seen_lon) {
      await supabaseServer
        .from('rescue_notification_events')
        .update({ status: 'processed', processed_at: new Date().toISOString(), error: 'Missing location' })
        .eq('id', event.id);
      results.push({ event_id: event.id, outbox_count: 0 });
      continue;
    }

    const { data: subscriptions } = await supabaseServer
      .from('rescue_volunteer_subscriptions')
      .select(
        'id,user_id,center_lat,center_lon,radius_km,species_filter,notify_lost,notify_found,is_enabled,rescue_volunteers!inner(is_enabled)',
      )
      .eq('is_enabled', true)
      .eq('rescue_volunteers.is_enabled', true);

    const filtered = (subscriptions ?? []).filter((sub: Subscription) => {
      const matchesType =
        (event.event_type === 'PET_LOST_PUBLIC' && sub.notify_lost) ||
        (event.event_type === 'PET_FOUND_PUBLIC' && sub.notify_found);
      if (!matchesType) return false;
      if (sub.species_filter && !sub.species_filter.includes(pet.species)) return false;
      const distance = haversineKm(pet.last_seen_lat as number, pet.last_seen_lon as number, sub.center_lat, sub.center_lon);
      return distance <= sub.radius_km;
    });

    const userIds = filtered.map((sub) => sub.user_id);
    const { data: rescue_profiles } = await supabaseServer
      .from('rescue_profiles')
      .select('id,email')
      .in('id', userIds);

    const emailMap = new Map((rescue_profiles ?? []).map((profile) => [profile.id, profile.email]));

    const outboxRows = filtered
      .map((sub) => {
        const toEmail = emailMap.get(sub.user_id);
        if (!toEmail) return null;
        return {
          event_id: event.id,
          user_id: sub.user_id,
          to_email: toEmail,
          subject: 'Yakınınızda kayıp ilanı var',
          body_html: buildEmailBody(pet),
        };
      })
      .filter(Boolean) as Array<{
      event_id: string;
      user_id: string;
      to_email: string;
      subject: string;
      body_html: string;
    }>;

    if (outboxRows.length > 0) {
      await supabaseServer.from('rescue_notification_outbox').insert(outboxRows);
    }

    for (const row of outboxRows) {
      if (!emailProvider) {
        continue;
      }

      try {
        const result = await sendEmail({ to: row.to_email, subject: row.subject, html: row.body_html });
        if (result.status === 'sent') {
          await supabaseServer
            .from('rescue_notification_outbox')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('event_id', row.event_id)
            .eq('user_id', row.user_id);
        }
      } catch (emailError) {
        await supabaseServer
          .from('rescue_notification_outbox')
          .update({ status: 'failed', error: emailError instanceof Error ? emailError.message : 'Email error' })
          .eq('event_id', row.event_id)
          .eq('user_id', row.user_id);
      }
    }

    await supabaseServer
      .from('rescue_notification_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', event.id);

    results.push({ event_id: event.id, outbox_count: outboxRows.length });
  }

  return NextResponse.json({ processed: results.length, results });
}
