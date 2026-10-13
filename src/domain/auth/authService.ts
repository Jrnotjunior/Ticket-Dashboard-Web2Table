import {requireSupabase} from '../../lib/supabase';
export async function authorizeSystemAdmin(_userId:string){
 const client=requireSupabase();
 const {data,error}=await client.rpc('system_admin_get_my_access_level');
 if(error)throw error;
 const access=Array.isArray(data)?data[0]:data;
 if(!access?.access_level||access.is_active!==true||access.status!=='active'){
  await client.auth.signOut();
  throw new Error('This account is not authorized to access the support desk.');
 }
 return {accessLevel:access.access_level as 'owner'|'administrator'|'view_only'};
}
export async function signIn(email:string,password:string){
 const client=requireSupabase();const {data,error}=await client.auth.signInWithPassword({email,password});
 if(error)throw error;if(!data.user)throw new Error('Sign-in did not return a user.');
 const access=await authorizeSystemAdmin(data.user.id);return {user:data.user,...access};
}
export async function signOut(){const {error}=await requireSupabase().auth.signOut();if(error)throw error;}