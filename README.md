# Web2Table Ticket Dashboard

Modular React + TypeScript + Vite support dashboard.

## Architecture
- `src/app`: application composition and session lifecycle
- `src/domain/auth`: administrator authentication and authorization
- `src/domain/tickets`: ticket models, labels, queries, updates, and realtime subscription
- `src/features/auth`: sign-in UI
- `src/features/tickets`: ticket list, filters, details, and status editor
- `src/shared/layout`: reusable application shell
- `src/lib`: Supabase client configuration
- `src/styles`: global design system and responsive styling

## Environment
Set these environment variables in the hosting provider:
- `VITE_SUPABASE_URL`: URL for the existing Restaurant Ordering Platform Supabase project
- `VITE_SUPABASE_ANON_KEY`: that project's publishable/anon key

Use the same Supabase project as the customer support form. Never place a service-role key in browser environment variables.

## Data and access
Reads from `public.restaurant_support_requests` and joins `public.restaurants` for tenant names. New and updated tickets are refreshed through Supabase Realtime. Active users in `public.system_admin_access` can sign in; owner/administrator roles can update status, while view-only administrators can read. Database RLS must remain enabled.

## Local development
```sh
npm install
npm run dev
``

## Production build
```sh
npm run build
``

Before production, configure the environment variables, ensure `restaurant_support_requests` is included in the Supabase Realtime publication, and validate administrator MFA requirements against the platform's existing security policy.