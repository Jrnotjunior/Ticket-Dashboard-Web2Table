import { useEffect, useMemo, useState } from 'react';
import type { SupportTicket, TicketStatus, TicketType } from '../../domain/tickets/types';
import { impactLabels, statusLabels, ticketTypeLabels } from '../../domain/tickets/types';
import { listCustomerRepliedTicketIds, subscribeToCustomerReplies } from '../../domain/tickets/customerReplyService';
import { requireSupabase } from '../../lib/supabase';
import { TicketOverview, type TicketOverviewFilter } from './overview/TicketOverview';
import './ticketListToolbar.css';

type Props = {
  tickets: SupportTicket[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onSelect: (ticket: SupportTicket) => void;
};

function matchesOverviewFilter(ticket: SupportTicket, filter: TicketOverviewFilter, customerRepliedIds: ReadonlySet<string>) {
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
    case 'recent': return new Date(ticket.updated_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    default: return true;
  }
}

export function TicketDashboard({ tickets, loading, error, onRefresh, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | TicketStatus>('all');
  const [type, setType] = useState<'all' | TicketType>('all');
  const [overviewFilter, setOverviewFilter] = useState<TicketOverviewFilter>('all');
  const [customerRepliedIds, setCustomerRepliedIds] = useState<Set<string>>(new Set());
  const [replyLoadError, setReplyLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const loadCustomerReplies = async () => {
      try {
        const ids = await listCustomerRepliedTicketIds(tickets);
        if (active) {
          setCustomerRepliedIds(ids);
          setReplyLoadError('');
        }
      } catch {
        if (active) setReplyLoadError('Customer reply counts could not be loaded.');
      }
    };

    void loadCustomerReplies();
    const channel = subscribeToCustomerReplies(() => { void loadCustomerReplies(); });
    return () => {
      active = false;
      void requireSupabase().removeChannel(channel);
    };
  }, [tickets]);

  const totalTickets = tickets.length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter(ticket =>
      matchesOverviewFilter(ticket, overviewFilter, customerRepliedIds) &&
      (status === 'all' || ticket.status === status) &&
      (type === 'all' || ticket.request_type === type) &&
      (!term || [ticket.request_number, ticket.subject, ticket.requester_email, ticket.restaurant?.name]
        .some(value => value?.toLowerCase().includes(term)))
    );
  }, [tickets, search, status, type, overviewFilter, customerRepliedIds]);

  return (
    <section className="tickets-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER OPERATIONS</p>
          <h1>Support tickets <span className="heading-count">{totalTickets}</span></h1>
          <p className="muted">Review, prioritize, and resolve requests from your restaurant customers.</p>
        </div>
        <div className="page-heading-actions">
          <div className="ticket-list-toolbar">
            <label className="search-box">
              <span>⌕</span>
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tickets…" aria-label="Search tickets" />
            </label>
            <div className="table-filters">
              <select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value as typeof status)}>
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select aria-label="Filter by type" value={type} onChange={event => setType(event.target.value as typeof type)}>
                <option value="all">All types</option>
                {Object.entries(ticketTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {(overviewFilter !== 'all' || status !== 'all' || type !== 'all' || search) && (
                <button className="button button-secondary" onClick={() => { setOverviewFilter('all'); setStatus('all'); setType('all'); setSearch(''); }}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
          <button className="button button-secondary" onClick={onRefresh}>↻ <span>Refresh</span></button>
        </div>
      </div>

      <TicketOverview
        tickets={tickets}
        customerRepliedIds={customerRepliedIds}
        activeFilter={overviewFilter}
        onFilterChange={setOverviewFilter}
      />



    </section>
  );
}

