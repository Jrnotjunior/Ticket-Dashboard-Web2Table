import {useEffect,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {requireSupabase,supabase} from '../lib/supabase';
import {authorizeSystemAdmin,signIn,signOut} from '../domain/auth/authService';
import type {SupportTicket} from '../domain/tickets/types';
import {listTickets,subscribeToTickets,unsubscribeFromTickets} from '../domain/tickets/ticketService';
import {LoginPage} from '../features/auth/LoginPage';
import {MfaGate} from '../features/auth/MfaGate';
import {TicketDashboard} from '../features/tickets/TicketDashboard';
import {TicketDetails} from '../features/tickets/TicketDetails';
import {useTicketNavigation} from '../features/tickets/useTicketNavigation';
import {AppShell} from '../shared/layout/AppShell';
export default function App(){
 const [user,setUser]=useState<User|null>(null);const [accessLevel,setAccessLevel]=useState<'owner'|'administrator'|'view_only'|null>(null);const [booting,setBooting]=useState(true);const [loginError,setLoginError]=useState('');const [busy,setBusy]=useState(false);const [tickets,setTickets]=useState<SupportTicket[]>([]);const [loadingTickets,setLoadingTickets]=useState(false);const [ticketError,setTicketError]=useState('');const [selected,setSelected]=useState<SupportTicket|null>(null);const [refreshKey,setRefreshKey]=useState(0);
 useEffect(()=>{if(!supabase){setBooting(false);return;}let active=true;void(async()=>{const {data:{session}}=await requireSupabase().auth.getSession();if(session?.user&&active){try{const access=await authorizeSystemAdmin(session.user.id);if(active){setUser(session.user);setAccessLevel(access.accessLevel);}}catch{if(active)setLoginError('Please sign in with an authorized support administrator account.');}}if(active)setBooting(false);})();const {data:{subscription}}=requireSupabase().auth.onAuthStateChange((_event,session)=>{if(!active)return;if(!session?.user){setUser(null);setAccessLevel(null);setTickets([]);setSelected(null);}});return()=>{active=false;subscription.unsubscribe();};},[]);
 useEffect(()=>{if(!user||!accessLevel)return;let active=true;setLoadingTickets(true);setTicketError('');const load=async()=>{try{const result=await listTickets();if(active)setTickets(result);}catch(e){const message=e&&typeof e==='object'&&'message' in e?String((e as {message:unknown}).message):e instanceof Error?e.message:'Unknown error while loading tickets.';if(active)setTicketError(message);}finally{if(active)setLoadingTickets(false);}};void load();const channel=subscribeToTickets(()=>setRefreshKey(v=>v+1));return()=>{active=false;unsubscribeFromTickets(channel);};},[user,accessLevel,refreshKey]);
 const handleSignIn=async(email:string,password:string)=>{setBusy(true);setLoginError('');try{const result=await signIn(email,password);setUser(result.user);setAccessLevel(result.accessLevel);}catch(e){setLoginError(e instanceof Error?e.message:'Unable to sign in.');}finally{setBusy(false);}};
 const {closeTicket}=useTicketNavigation(tickets,setSelected);
 const refresh=()=>setRefreshKey(v=>v+1);
 if(!supabase)return <div className="setup-screen"><div className="setup-card"><span className="brand-mark">W</span><h1>Support Desk setup</h1><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the app environment variables.</p></div></div>;
 if(booting)return <div className="loading-screen"><span className="spinner"/> Checking secure session…</div>;
 if(!user)return <LoginPage onSubmit={handleSignIn} busy={busy} error={loginError}/>;
 return <MfaGate><AppShell userEmail={user.email??'Administrator'} onSignOut={()=>void signOut()}><TicketDashboard tickets={tickets} loading={loadingTickets} error={ticketError}/>{selected&&<TicketDetails ticket={tickets.find(t=>t.id===selected.id)??selected} accessLevel={accessLevel} onClose={closeTicket} onSaved={refresh}/>}</AppShell></MfaGate>;
}