import { requireSupabase } from '../../lib/supabase';

export async function authorizeSystemAdmin() {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) throw new Error('Your Web2Table session is invalid or expired.');

  const { data, error } = await client
    .from('platform_admins')
    .select('access_level,is_active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error('Unable to verify your Web2Table administrator access.');
  if (!data || data.is_active !== true) {
    await client.auth.signOut();
    throw new Error('This Web2Table account is not an active platform administrator.');
  }

  return { user, accessLevel: data.access_level as 'owner' | 'administrator' | 'view_only' };
}

export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-in did not return a user.');
  // Administrator lookup is intentionally deferred until MFA has elevated the session to AAL2.
  return { user: data.user };
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
