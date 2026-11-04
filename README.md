# Web2Table Ticket Dashboard

Modular React + TypeScript + Vite support dashboard.

## Architecture
- `src/app`: application composition and Web2Table session lifecycle
- `src/domain/auth`: authentication against the original Web2Table project and platform-admin authorization
- `src/domain/tickets`: ticket models and services routed through the ticket admin gateway
- `src/features/auth`: sign-in UI
- `src/features/tickets`: ticket list, filters, details, and status editor
- `src/shared/layout`: reusable application shell
- `src/lib`: original Web2Table Supabase client configuration

## Environment
Configure these browser environment variables in the hosting provider:
- `VITE_SUPABASE_URL`: URL for the original Web2Table operational Supabase project
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key for that same project

Never place a service-role key in browser environment variables.

## Ticket data architecture
Ticket records and private attachments live in the separate Web2Table-Tickets Supabase project. The browser does not query that database directly. It calls the `support-admin-portal` Edge Function with the active Web2Table access token. The function validates the token against the original Web2Table Auth service and checks the user's active `public.platform_admins` record before using its server-side ticket database credentials.

The ticket gateway supports ticket listing and status updates, conversations, attachment upload/download links, overview counts, and customer-reply indicators. It enforces read-only access for `view_only` administrators. Ticket attachments remain in private storage and are served through short-lived signed URLs.

## Updates
The dashboard currently refreshes ticket data using authenticated polling at five-second intervals. This is polling, not Supabase Realtime; it avoids requiring a second browser-authenticated session in the separate ticket project.

## Local development
```sh
npm install
npm run dev
```

## Production build
```sh
npm run build
```

Before production, configure the original Web2Table environment variables, verify the `support-admin-portal` Edge Function secrets (`WEB2TABLE_PROJECT_URL` and `WEB2TABLE_PUBLISHABLE_KEY`) and ticket-project service-role secret, and validate administrator MFA requirements against the platform's existing security policy.
