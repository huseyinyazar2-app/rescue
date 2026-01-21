# MatrixC Rescue – Admin Console (Part 1)

## Overview
This repo contains the Admin/Superuser console for MatrixC Rescue. It includes:
- Admin-only API routes under `/api/admin/*`
- Admin dashboard and management pages under `/admin`
- Supabase schema migrations with RLS
- Audit logging for sensitive and privileged operations

## Environment Variables
Set these in `.env.local` or your Vercel environment:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
IP_HASH_SECRET=
APP_BASE_URL=
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Apply the SQL migration in `db/migrations/001_admin.sql` to your Supabase project.
3. Create a profile row for your admin user in the `profiles` table and set `role='admin'`.
4. Run the app:
   ```bash
   npm run dev
   ```

## Admin Access
Admin API routes require a Bearer token from Supabase Auth. The server uses the service role key to validate tokens and check the `profiles.role`.

## Batch Creation
POST `/api/admin/batches/create` with JSON payload:

```json
{ "quantity": 100, "name": "Batch-2026-01-21-100pcs" }
```

Response includes:
- `batch_id`
- `tags` with `public_code` and one-time `pin`
- `csv` string (public_code + pin)

## Exports
- PDF: `/api/admin/batches/:id/export/pdf` (A4 grid with QR + public code)
- PNG (single tag): `/api/admin/tags/:id/export/png`

## Audit Logs
Admin actions are written to `audit_logs`, including:
- Batch creation
- Export requests
- Sensitive sighting view
- Role changes

## Tests
Run:
```bash
npm test
```

Tests include:
- RBAC for non-admins
- Batch tag uniqueness
- Audit log on sensitive view
