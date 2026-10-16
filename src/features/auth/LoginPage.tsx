import {useState,type FormEvent} from 'react';
type Props={onSubmit:(email:string,password:string)=>void;busy:boolean;error:string};
export function LoginPage({onSubmit,busy,error}:Props){
 const[email,setEmail]=useState('');
 const[password,setPassword]=useState('');
 const[showPassword,setShowPassword]=useState(false);
 const submit=(e:FormEvent)=>{e.preventDefault();onSubmit(email.trim(),password);};
 return <main className="login-screen"><section className="login-card">
  <img className="login-brand-image company-logo" src="https://xaihajwrsvcdjisezmmc.supabase.co/storage/v1/object/public/web2table-assets/web2table%20(1).png" alt="Web2Table logo"/>
  <p className="eyebrow login-platform-label">WEB2TABLE PLATFORM</p>
  <h1>Ticket Dashboard</h1>
  <p className="muted login-description">Sign in to manage support tickets and customer requests.</p>
  <form onSubmit={submit} className="login-form">
   <label>Email address<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label>Password<span className="password-input-wrap"><input type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="password-visibility-toggle" type="button" aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{showPassword&&<path d="M4 4 20 20"/>}</svg></button></span></label>
   {error&&<div className="alert alert-error" role="alert">{error}</div>}
   <button className="button button-primary login-submit-button" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
  </form>
 </section></main>;
}