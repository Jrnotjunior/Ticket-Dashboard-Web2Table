import { createClient } from '@supabase/supabase-js';

// The ticket dashboard uses its dedicated Supabase project. The publishable
// key is intended for browser use; authorization is enforced by RLS and RPCs.
const url = 'https://cishhexduxgrwdvptuhj.supabase.co';
const publishableKey = 'sb_publishable_tr8QdcIBOu2FfjMx_7YyjA_sP4ZM782';

export const supabase = createClient(url, publishableKey, {
  auth: { storageKey: 'web2table-ticket-dashboard-auth' },
});

export function requireSupabase() {
  return supabase;
}
