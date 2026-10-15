import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import {requireSupabase} from '../../lib/supabase';
type GateProps={children:ReactNode};
type GateState={kind:'checking'}|{kind:'enroll';factorId:string;qrCode:string;secret:string}|{kind:'challenge';factorId:string}|{kind:'ready'}|{kind:'error';message:string};
export function MfaGate({children}:GateProps){
 const[state,setState]=useState<GateState>({kind:'checking'});const[code,setCode]=useState('');const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);
 async function inspect(){
  setState({kind:'checking'});const client=requireSupabase();
  const {data:level,error:levelError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(levelError){setState({kind:'error',message:levelError.message});return;}
  if(level.currentLevel==='aal2'){setState({kind:'ready'});return;}
  const {data:factors,error}=await client.auth.mfa.listFactors();
  if(error){setState({kind:'error',message:error.message});return;}
  const verified=factors.totp.find(f=>f.status==='verified');
  if(verified){setState({kind:'challenge',factorId:verified.id});return;}
  const {data:enrollment,error:enrollError}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Web2Table Support Desk'});
  if(enrollError){setState({kind:'error',message:enrollError.message});return;}
  setState({kind:'enroll',factorId:enrollment.id,qrCode:enrollment.totp.qr_code,secret:enrollment.totp.secret});
 }
 useEffect(()=>{void inspect().catch(e=>setState({kind:'error',message:e instanceof Error?e.message:'Security verification failed.'}));},[]);
 useEffect(()=>{
  if(state.kind!=='challenge'&&state.kind!=='enroll')return;
  let expired=false;
  const timeout=window.setTimeout(async()=>{
   expired=true;
   try{await requireSupabase().auth.signOut();}finally{window.location.reload();}
  },60_000);
  return()=>{window.clearTimeout(timeout);void expired;};
 },[state.kind]);
 async function verify(e:FormEvent){
  e.preventDefault();if(state.kind!=='challenge'&&state.kind!=='enroll')return;
  setBusy(true);setMessage('');
  try{const client=requireSupabase();const {data:challenge,error:challengeError}=await client.auth.mfa.challenge({factorId:state.factorId});if(challengeError)throw challengeError;
   const {error:verifyError}=await client.auth.mfa.verify({factorId:state.factorId,challengeId:challenge.id,code:code.trim()});if(verifyError)throw verifyError;
   const {data:assurance,error:assuranceError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(assuranceError)throw assuranceError;
   if(assurance.currentLevel!=='aal2')throw new Error('The security code was accepted, but the session is not fully verified yet.');
   setCode('');setState({kind:'ready'});
  }catch(e){setMessage(e instanceof Error?e.message:'Could not verify your authenticator code.');}finally{setBusy(false);}
 }
 if(state.kind==='ready')return <>{children}</>;
 if(state.kind==='checking')return <div className="loading-screen"><span className="spinner"/> Verifying multi-factor security…</div>;
 if(state.kind==='error')return <main className="login-screen"><section className="login-card"><p className="eyebrow">ACCOUNT SECURITY</p><h1>Security check unavailable</h1><p className="muted">{state.message}</p><button className="button button-primary button-wide" onClick={()=>void inspect()}>Try again</button></section></main>;
 const enrolling=state.kind==='enroll';
 return <main className="login-screen"><section className="login-card mfa-card"><p className="eyebrow">WEB2TABLE SECURITY</p><h1>{enrolling?'Set up your authenticator':'Verify your identity'}</h1><p className="muted">{enrolling?'Scan the QR code with an authenticator app, then enter its six-digit code.':'Enter the current six-digit code from your authenticator app to access support tickets.'}</p>
 {enrolling&&<div className="mfa-enrollment"><img src={state.qrCode} alt="Authenticator enrollment QR code" style={{display:'block',width:'min(100%,260px)',margin:'18px auto'}}/><details><summary>Set up manually</summary><p className="muted">Enter this key in your authenticator app:</p><code style={{display:'block',overflowWrap:'anywhere',padding:10,userSelect:'all'}}>{state.secret}</code></details></div>}
 <form className="login-form" onSubmit={verify}><label htmlFor="mfa-code">Six-digit authentication code</label><input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} required/>{message&&<div className="alert alert-error" role="alert">{message}</div>}<button className="button button-primary button-wide" disabled={busy || code.length !== 6}>{busy?'Verifying…':enrolling?'Verify':'Verify'}</button></form></section></main>;
}