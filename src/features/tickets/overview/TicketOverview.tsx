import type { SupportTicket } from '../../../domain/tickets/types';
import './ticketOverview.css';

export type TicketOverviewFilter =
  | 'all' | 'incident' | 'change_request' | 'request_item'
  | 'incident_in_progress' | 'change_in_progress' | 'request_item_in_progress'
  | 'p1' | 'p2' | 'high_in_progress'
  | 'incident_replied' | 'change_replied' | 'request_item_replied' | 'resolved';

export type TicketOverviewCounts = {
  all_tickets: number; high_in_progress: number; p1: number; p2: number;
  incidents: number; change_requests: number; request_items: number;
  incidents_in_progress: number; changes_in_progress: number; request_items_in_progress: number;
  incidents_updated_by_customer: number; changes_updated_by_customer: number;
  request_items_updated_by_customer: number; resolved_closed: number;
};

type OverviewItem = { id: TicketOverviewFilter; label: string; hint: string; count: number; icon: string; tone?: 'critical' | 'warning' };
type Props = { tickets: SupportTicket[]; counts: TicketOverviewCounts | null };

export function TicketOverview({ counts }: Props) {
  const items: OverviewItem[] = [
    { id: 'all', label: 'All Tickets', hint: 'Total requests', count: counts?.all_tickets ?? 0, icon: '▤' },
    { id: 'high_in_progress', label: 'High Priority · In Progress', hint: 'High / critical and in progress', count: counts?.high_in_progress ?? 0, icon: '♨', tone: 'warning' },
    { id: 'p1', label: 'P1 · Critical', hint: 'Active critical-impact tickets', count: counts?.p1 ?? 0, icon: '⚠', tone: 'critical' },
    { id: 'p2', label: 'P2 · High', hint: 'Active high-impact tickets', count: counts?.p2 ?? 0, icon: 'ⓘ', tone: 'warning' },
    { id: 'incident', label: 'Incidents', hint: 'Active incident tickets', count: counts?.incidents ?? 0, icon: '!', tone: 'critical' },
    { id: 'change_request', label: 'Change Requests', hint: 'Active planned changes', count: counts?.change_requests ?? 0, icon: '↗' },
    { id: 'request_item', label: 'RTM / Request Items', hint: 'Active service requests', count: counts?.request_items ?? 0, icon: '▤' },
    { id: 'incident_in_progress', label: 'Incident In Progress', hint: 'Incidents currently being worked', count: counts?.incidents_in_progress ?? 0, icon: '◷' },
    { id: 'change_in_progress', label: 'Change In Progress', hint: 'Change requests currently being worked', count: counts?.changes_in_progress ?? 0, icon: '◷' },
    { id: 'request_item_in_progress', label: 'RTM In Progress', hint: 'Request items currently being worked', count: counts?.request_items_in_progress ?? 0, icon: '◷' },
    { id: 'incident_replied', label: 'Incident Updated by Customer', hint: 'Active incidents awaiting support reply', count: counts?.incidents_updated_by_customer ?? 0, icon: '☏', tone: 'critical' },
    { id: 'change_replied', label: 'Change Updated by Customer', hint: 'Active changes awaiting support reply', count: counts?.changes_updated_by_customer ?? 0, icon: '☏', tone: 'critical' },
    { id: 'request_item_replied', label: 'RTM Updated by Customer', hint: 'Active request items awaiting support reply', count: counts?.request_items_updated_by_customer ?? 0, icon: '☏', tone: 'critical' },
    { id: 'resolved', label: 'Resolved / Closed', hint: 'Completed requests', count: counts?.resolved_closed ?? 0, icon: '✓' },
  ];
  return (
    <section className="ticket-overview" aria-labelledby="ticket-overview-title">
      <header className="ticket-overview-heading">
        <div><h2 id="ticket-overview-title">Ticket Overview</h2><p>Monitor support workload and prioritize important requests.</p></div>
        <span className="ticket-overview-live"><i /> Live counts</span>
      </header>
      <div className="ticket-overview-grid">
        {items.map(item => (
          <a key={item.id} href={`?filter=${item.id}`} className={`ticket-overview-card${item.tone ? ` is-${item.tone}` : ''}`} aria-label={`${item.label}: ${item.count} tickets`}>
            <span className="ticket-overview-card-top"><span className="ticket-overview-icon" aria-hidden="true">{item.icon}</span><span className="ticket-overview-count">{item.count}</span></span>
            <span className="ticket-overview-label">{item.label}</span><span className="ticket-overview-hint">{item.hint}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
