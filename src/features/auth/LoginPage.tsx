import {useState,type FormEvent} from 'react';
import './loginPage.css';

type Props={onSubmit:(email:string,password:string)=>void;busy:boolean;error:string};

export function LoginPage({onSubmit,busy,error}:Props){
 const[email,setEmail]=useState('');
 const[password,setPassword]=useState('');
 const[showPassword,setShowPassword]=useState(false);
 const submit=(e:FormEvent)=>{e.preventDefault();onSubmit(email.trim(),password);};
 return <main className="ticket-auth-screen"><section className="ticket-auth-card">
  <h1>Sign In</h1>
  <p className="ticket-auth-description">Welcome back. Sign in to continue to your support dashboard.</p>
  <form onSubmit={submit} className="ticket-auth-form">
   <label>Email address<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label>Password<span className="ticket-auth-password"><input type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="ticket-auth-toggle" type="button" aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{showPassword&&<path d="M4 4 20 20"/>}</svg></button></span></label>
   {error&&<div className="ticket-auth-error" role="alert">{error}</div>}
   <button className="ticket-auth-submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
  </form>
 </section></main>;
}
