import {useState} from 'react';
import type {SupportTicket,TicketStatus} from '../../domain/tickets/types';
import {impactLabels,statusLabels,ticketTypeLabels} from '../../domain/tickets/types';
import {updateTicketStatus} from '../../domain/tickets/ticketService';
import {TicketConversation} from './TicketConversation';
type Props={ticket:SupportTicket;accessLevel:'owner'|'administrator'|'view_only'|null;onClose:()=>void;onSaved:()=>void};
export function TicketDetails({ticket,accessLevel,onClose,onSaved}:Props){
 const [status,setStatus]=useState<TicketStatus>(ticket.status); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
 const canEdit=accessLevel==='owner'||accessLevel==='administrator';
 async function save(){setSaving(true);setError('');try{await updateTicketStatus(ticket.id,status);onSaved();onClose();}catch(e){setError(e instanceof Error?e.message:'Could not save changes.');}finally{setSaving(false);}}
 return <div className="drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><aside className="ticket-drawer" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title">
 <header className="drawer-header"><div><p className="eyebrow">TICKET DETAILS</p><h2 id="ticket-detail-title">{ticket.request_number??'Support request'}</h2></div><button className="icon-button close-button" onClick={onClose} aria-label="Close details">×</button></header>
 <div className="drawer-body"><span className={'type-badge type-'+ticket.request_type}>{ticketTypeLabels[ticket.request_type]}</span><h3 className="detail-subject">{ticket.subject}</h3><p className="detail-meta">Submitted {new Date(ticket.created_at).toLocaleString()}</p>
 <div className="detail-grid"><div><span>Restaurant</span><strong>{ticket.restaurant?.name??'Restaurant'}</strong></div><div><span>Requester</span><strong>{ticket.requester_email??'Not provided'}</strong></div><div><span>Impact</span><strong>{impactLabels[ticket.impact]}</strong></div><div className="detail-status-field"><span>Current status</span><strong>{statusLabels[ticket.status]}</strong>{canEdit&&<div className="status-editor-inline"><label htmlFor="ticket-status">Update status</label><select id="ticket-status" value={status} onChange={e=>setStatus(e.target.value as TicketStatus)}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>{error&&<div className="alert alert-error">{error}</div>}<button className="button button-primary button-compact" disabled={saving||status===ticket.status} onClick={()=>void save()}>{saving?'Saving…':'Save status'}</button></div>}</div></div>
 <section className="description-section"><h4>Description</h4><p>{ticket.description}</p></section><div className="detail-id"><span>Internal record ID</span><code>{ticket.id}</code></div><TicketConversation ticket={ticket} accessLevel={accessLevel}/>
 {!canEdit&&<p className="view-only-note">This account has read-only access.</p>}
 </div></aside></div>;
}