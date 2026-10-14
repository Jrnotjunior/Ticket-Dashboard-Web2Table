import { useEffect, useState } from 'react';
import type { SupportTicket } from '../../domain/tickets/types';
import { impactLabels, statusLabels, ticketTypeLabels } from '../../domain/tickets/types';
import { listCustomerRepliedTicketIds, subscribeToCustomerReplies } from '../../domain/tickets/customerReplyService';
import { requireSupabase } from '../../lib/supabase';
import { TicketOverview, type TicketOverviewFilter } from './overview/TicketOverview';

type Props = {
  tickets: SupportTicket[];
  loading: boolean;
  error: string;
  onSelect: (ticket: SupportTicket) => void;
};

const filterLabels: Record<TicketOverviewFilter, string> = {
  all: 'All Tickets',
  incident: 'Incidents',
  change_request: 'Change Requests',
  request_item: 'RTM / Request Items',
  in_progress: 'In Progress',
  p1: 'P1 · Critical',
  p2: 'P2 · High',
  high_in_progress: 'High Priority · In Progress',
  customer_replied: 'Customer Replied',
  open: 'Open Tickets',
  resolved: 'Resolved / Closed',
  recent: 'Recently Updated',
};

function matchesFilter(ticket: SupportTicket, filter: TicketOverviewFilter, customerRepliedIds: ReadonlySet<string>) {
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  switch (filter) {
    case 'incident': return ticket.request_type === 'incident';
    case 'change_request': return ticket.request_type === 'change_request';
    case 'request_item': return ticket.request_type === 'request_item';
    case 'in_progress': return ticket.status === 'in_progress';
    case 'p1': return ticket.impact === 'critical';
    case 'p2': return ticket.impact === 'high';
    case 'high_in_progress': return ticket.status === 'in_progress' && (ticket.impact === 'high' || ticket.impact === 'critical');
    case 'customer_replied': return customerRepliedIds.has(ticket.id);
    case 'open': return ticket.status === 'open' || ticket.status === 'in_progress';
    case 'resolved': return ticket.status === 'resolved' || ticket.status === 'closed';
    case 'recent': return new Date(ticket.updated_at).getTime() >= recentCutoff;
    default: return true;
  }
}

function getRequestedFilter(): TicketOverviewFilter | null {
  const value = new URLSearchParams(window.location.search).get('filter');
  return value && value in filterLabels ? value as TicketOverviewFilter : null;
}

export function TicketDashboard({ tickets, loading, error, onSelect }: Props) {
  const [customerRepliedIds, setCustomerRepliedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<TicketOverviewFilter | null>(() => getRequestedFilter());

  useEffect(() => {
    const syncFilter = () => setActiveFilter(getRequestedFilter());
    window.addEventListener('popstate', syncFilter);
    return () => window.removeEventListener('popstate', syncFilter);
  }, []);

  useEffect(() => {
    let active = true;
    const loadCustomerReplies = async () => {
      try {
        const ids = await listCustomerRepliedTicketIds(tickets);
        if (active) setCustomerRepliedIds(ids);
      } catch {
        // Keep the dashboard available if reply-count loading fails.
      }
    };
    void loadCustomerReplies();
    const channel = subscribeToCustomerReplies(() => { void loadCustomerReplies(); });
    return () => {
      active = false;
      void requireSupabase().removeChannel(channel);
    };
  }, [tickets]);

  const filteredTickets = activeFilter
    ? tickets.filter(ticket => matchesFilter(ticket, activeFilter, customerRepliedIds))
    : [];

  return (
    <section className="tickets-page">
      {activeFilter ? (
        <section className="filtered-ticket-view">
          <a className="filtered-ticket-back" href="./">← Back to Ticket Overview</a>
          <div className="page-heading">
            <div>
              <p className="eyebrow">CUSTOMER OPERATIONS</p>
              <h1>{filterLabels[activeFilter]} <span className="heading-count">{filteredTickets.length}</span></h1>
              <p className="muted">Tickets matching this category. Select a ticket to view its details.</p>
            </div>
          </div>
          {error && <p className="filtered-ticket-message">{error}</p>}
          {loading && tickets.length === 0 ? <p className="filtered-ticket-message">Loading tickets…</p> :
            filteredTickets.length === 0 ? <p className="filtered-ticket-message">No tickets match this category.</p> : (
              <div className="filtered-ticket-list">
                {filteredTickets.map(ticket => (
                  <a className="filtered-ticket-row" href={`?ticket=${encodeURIComponent(ticket.id)}`} key={ticket.id}>
                    <span className="filtered-ticket-main">
                      <strong>{ticket.request_number ?? 'Support request'}</strong>
                      <span>{ticket.subject}</span>
                      <small>{ticket.restaurant?.name ?? 'Restaurant'} · {ticket.requester_email ?? 'No requester email'}</small>
                    </span>
                    <span className="filtered-ticket-badges">
                      <span className={'type-badge type-' + ticket.request_type}>{ticketTypeLabels[ticket.request_type]}</span>
                      <span className={'impact impact-' + ticket.impact}>{impactLabels[ticket.impact]}</span>
                      <span className={'status-badge status-' + ticket.status}>{statusLabels[ticket.status]}</span>
                    </span>
                    <span className="filtered-ticket-arrow" aria-hidden="true">›</span>
                  </a>
                ))}
              </div>
            )}
        </section>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">CUSTOMER OPERATIONS</p>
              <h1>Support tickets <span className="heading-count">{tickets.length}</span></h1>
              <p className="muted">Review, prioritize, and resolve requests from your restaurant customers.</p>
            </div>
          </div>
          <TicketOverview
            tickets={tickets}
            customerRepliedIds={customerRepliedIds}
            activeFilter="all"
            onFilterChange={() => undefined}
          />
        </>
      )}
    </section>
  );
}
