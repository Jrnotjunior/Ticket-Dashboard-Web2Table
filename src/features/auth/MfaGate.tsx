import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {requireSupabase} from '../../lib/supabase';
import './mfaVerification.css';
type GateProps={children:ReactNode;onVerified:()=>Promise<void>;onSignOut:()=>void};
type GateState={kind:'checking'}|{kind:'enroll';factorId:string;qrCode:string;secret:string}|{kind:'challenge';factorId:string}|{kind:'ready'}|{kind:'error';message:string};
export function MfaGate({children,onVerified,onSignOut}:GateProps){
 const[state,setState]=useState<GateState>({kind:'checking'});const[code,setCode]=useState('');const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);const codeInput=useRef<HTMLInputElement>(null);
 async function inspect(){
  setState({kind:'checking'});const client=requireSupabase();
  const {data:level,error:levelError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(levelError){setState({kind:'error',message:levelError.message});return;}
  if(level.currentLevel==='aal2'){await onVerified();setState({kind:'ready'});return;}
  const {data:factors,error}=await client.auth.mfa.listFactors();
  if(error){setState({kind:'error',message:error.message});return;}
  const verified=factors.totp.find(f=>f.status==='verified');
  if(verified){setState({kind:'challenge',factorId:verified.id});return;}
  const {data:enrollment,error:enrollError}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Web2Table Support Desk'});
  if(enrollError){setState({kind:'error',message:enrollError.message});return;}
  setState({kind:'enroll',factorId:enrollment.id,qrCode:enrollment.totp.qr_code,secret:enrollment.totp.secret});
 }
 useEffect(()=>{void inspect().catch(e=>setState({kind:'error',message:e instanceof Error?e.message:'Security verification failed.'}));},[]);
 useEffect(()=>{if(state.kind==='challenge'||state.kind==='enroll')codeInput.current?.focus();},[state.kind]);
 async function verify(e:FormEvent){
  e.preventDefault();if(state.kind!=='challenge'&&state.kind!=='enroll')return;
  if(code.length!==6)return;
  setBusy(true);setMessage('');
  try{const client=requireSupabase();const {data:challenge,error:challengeError}=await client.auth.mfa.challenge({factorId:state.factorId});if(challengeError)throw challengeError;
   const {error:verifyError}=await client.auth.mfa.verify({factorId:state.factorId,challengeId:challenge.id,code});if(verifyError)throw verifyError;
   const {data:assurance,error:assuranceError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(assuranceError)throw assuranceError;
   if(assurance.currentLevel!=='aal2')throw new Error('The security code was accepted, but the session is not fully verified yet.');
   await onVerified();setCode('');setState({kind:'ready'});
  }catch(e){setMessage(e instanceof Error?e.message:'Could not verify your authenticator code.');setCode('');codeInput.current?.focus();}finally{setBusy(false);}
 }
 if(state.kind==='ready')return <>{children}</>;
 if(state.kind==='checking')return <div className="ticket-mfa-loading"><span className="spinner"/> Verifying secure session…</div>;
 if(state.kind==='error')return <main className="ticket-mfa-screen"><section className="ticket-mfa-card"><h1>Security check unavailable</h1><p className="ticket-mfa-description">{state.message}</p><button className="ticket-mfa-primary" onClick={()=>void inspect()}>Try again</button><button className="ticket-mfa-secondary" onClick={onSignOut}>Sign out</button></section></main>;
 const enrolling=state.kind==='enroll';
 return <main className="ticket-mfa-screen"><section className="ticket-mfa-card">
  <h1>{enrolling?'Set up your authenticator':'Verify your identity'}</h1>
  <p className="ticket-mfa-description">{enrolling?'Scan the QR code with your authenticator app, then enter its current six-digit code.':'Your authenticator is already set up. Enter its current six-digit code to continue to your workspace.'}</p>
  {enrolling&&<div className="ticket-mfa-enrollment"><img src={state.qrCode} alt="Authenticator enrollment QR code"/><details><summary>Set up manually</summary><code>{state.secret}</code></details></div>}
  <form onSubmit={verify} className="ticket-mfa-form">
   <label htmlFor="ticket-mfa-code">Authenticator code</label>
   <div className="ticket-mfa-code-wrap" onClick={()=>codeInput.current?.focus()}>
    <div className="ticket-mfa-code-cells" aria-hidden="true">{Array.from({length:6},(_,i)=><span className={i===code.length?'is-current':''} key={i}>{code[i]||''}</span>)}</div>
    <input ref={codeInput} id="ticket-mfa-code" className="ticket-mfa-code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\\D/g,'').slice(0,6))} aria-label="Six-digit authenticator code" required/>
   </div>
   <p className="ticket-mfa-hint">Enter the 6-digit code from your authenticator app.</p>
   {message&&<div className="ticket-mfa-error" role="alert">{message}</div>}
   <button className="ticket-mfa-primary" disabled={busy||code.length!==6}>{busy?'Verifying…':'Verify authenticator'}</button>
   <button type="button" className="ticket-mfa-secondary" onClick={onSignOut} disabled={busy}>Sign out</button>
  </form>
 </section></main>;
}
