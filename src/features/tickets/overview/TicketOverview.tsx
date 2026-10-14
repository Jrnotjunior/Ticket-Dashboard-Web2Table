import type { SupportTicket } from '../../../domain/tickets/types';
import './ticketOverview.css';

export type TicketOverviewFilter =
  | 'all'
  | 'incident'
  | 'change_request'
  | 'request_item'
  | 'incident_in_progress'
  | 'change_in_progress'
  | 'request_item_in_progress'
  | 'p1'
  | 'p2'
  | 'high_in_progress'
  | 'incident_replied'
  | 'change_replied'
  | 'request_item_replied'
  | 'open'
  | 'resolved'
  | 'recent';

type OverviewItem = {
  id: TicketOverviewFilter;
  label: string;
  hint: string;
  count: number;
  icon: string;
  tone?: 'critical' | 'warning';
};

type Props = {
  tickets: SupportTicket[];
  customerRepliedIds: ReadonlySet<string>;
};

export function TicketOverview({ tickets, customerRepliedIds }: Props) {
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isOpen = (ticket: SupportTicket) => ticket.status === 'open' || ticket.status === 'in_progress';
  const isHighPriority = (ticket: SupportTicket) => ticket.impact === 'high' || ticket.impact === 'critical';

  const items: OverviewItem[] = [
    { id: 'all', label: 'All Tickets', hint: 'Total requests', count: tickets.length, icon: '▤' },
    { id: 'incident', label: 'Incidents', hint: 'Incident tickets', count: tickets.filter(t => t.request_type === 'incident').length, icon: '!', tone: 'critical' },
    { id: 'change_request', label: 'Change Requests', hint: 'Planned changes', count: tickets.filter(t => t.request_type === 'change_request').length, icon: '↗' },
    { id: 'request_item', label: 'RTM / Request Items', hint: 'Service requests', count: tickets.filter(t => t.request_type === 'request_item').length, icon: '▤' },
    { id: 'incident_in_progress', label: 'Incident In Progress', hint: 'Incidents currently being worked', count: tickets.filter(t => t.request_type === 'incident' && t.status === 'in_progress').length, icon: '◷' },
    { id: 'change_in_progress', label: 'Change In Progress', hint: 'Change requests currently being worked', count: tickets.filter(t => t.request_type === 'change_request' && t.status === 'in_progress').length, icon: '◷' },
    { id: 'request_item_in_progress', label: 'RTM In Progress', hint: 'Request items currently being worked', count: tickets.filter(t => t.request_type === 'request_item' && t.status === 'in_progress').length, icon: '◷' },
    { id: 'p1', label: 'P1 · Critical', hint: 'Critical impact', count: tickets.filter(t => t.impact === 'critical').length, icon: '⚠', tone: 'critical' },
    { id: 'p2', label: 'P2 · High', hint: 'High impact', count: tickets.filter(t => t.impact === 'high').length, icon: 'ⓘ', tone: 'warning' },
    { id: 'high_in_progress', label: 'High Priority · In Progress', hint: 'High / critical and in progress', count: tickets.filter(t => t.status === 'in_progress' && isHighPriority(t)).length, icon: '♨', tone: 'warning' },
    { id: 'incident_replied', label: 'Incident Updated by Customer', hint: 'Incidents with a new customer reply', count: tickets.filter(t => t.request_type === 'incident' && customerRepliedIds.has(t.id)).length, icon: '☏', tone: 'critical' },
    { id: 'change_replied', label: 'Change Updated by Customer', hint: 'Change requests with a new customer reply', count: tickets.filter(t => t.request_type === 'change_request' && customerRepliedIds.has(t.id)).length, icon: '☏', tone: 'critical' },
    { id: 'request_item_replied', label: 'RTM Updated by Customer', hint: 'Request items with a new customer reply', count: tickets.filter(t => t.request_type === 'request_item' && customerRepliedIds.has(t.id)).length, icon: '☏', tone: 'critical' },
    { id: 'open', label: 'Open Tickets', hint: 'Open or in progress', count: tickets.filter(isOpen).length, icon: '○' },
    { id: 'resolved', label: 'Resolved / Closed', hint: 'Completed requests', count: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length, icon: '✓' },
    { id: 'recent', label: 'Recently Updated', hint: 'Updated in the last 7 days', count: tickets.filter(t => new Date(t.updated_at).getTime() >= recentCutoff).length, icon: '↻' },
  ];

  return (
    <section className="ticket-overview" aria-labelledby="ticket-overview-title">
      <header className="ticket-overview-heading">
        <div>
          <h2 id="ticket-overview-title">Ticket Overview</h2>
          <p>Monitor support workload and prioritize important requests.</p>
        </div>
        <span className="ticket-overview-live"><i /> Live counts</span>
      </header>
      <div className="ticket-overview-grid">
        {items.map(item => (
          <a
            key={item.id}
            href={`?filter=${item.id}`}
            className={`ticket-overview-card${item.tone ? ` is-${item.tone}` : ''}`}
          >
            <span className="ticket-overview-card-top">
              <span className="ticket-overview-icon" aria-hidden="true">{item.icon}</span>
              <span className="ticket-overview-count">{item.count}</span>
            </span>
            <span className="ticket-overview-label">{item.label}</span>
            <span className="ticket-overview-hint">{item.hint}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
