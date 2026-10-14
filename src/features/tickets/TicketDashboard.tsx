import { useEffect, useState } from 'react';
import type { SupportTicket } from '../../domain/tickets/types';
import { impactLabels, statusLabels, ticketTypeLabels } from '../../domain/tickets/types';
import './ticketSearch.css';
import { listCustomerRepliedTicketIds, subscribeToCustomerReplies } from '../../domain/tickets/customerReplyService';
import { requireSupabase } from '../../lib/supabase';
import { TicketOverview, type TicketOverviewFilter, type TicketOverviewCounts } from './overview/TicketOverview';
import { getTicketOverviewCounts, subscribeToTicketOverviewCounts } from '../../domain/tickets/ticketOverviewService';

type Props = {
  tickets: SupportTicket[];
  loading: boolean;
  error: string;
};

const filterLabels: Record<TicketOverviewFilter, string> = {
  all: 'All Tickets',
  incident: 'Incidents',
  change_request: 'Change Requests',
  request_item: 'RTM / Request Items',
  incident_in_progress: 'Incident In Progress',
  change_in_progress: 'Change In Progress',
  request_item_in_progress: 'RTM In Progress',
  p1: 'P1 · Critical',
  p2: 'P2 · High',
  high_in_progress: 'High Priority · In Progress',
  incident_replied: 'Incident Updated by Customer',
  change_replied: 'Change Updated by Customer',
  request_item_replied: 'RTM Updated by Customer',
  resolved: 'Resolved / Closed',
};

function matchesFilter(ticket: SupportTicket, filter: TicketOverviewFilter, customerRepliedIds: ReadonlySet<string>) {
  const isActive = ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.status !== 'cancelled';
  switch (filter) {
    case 'incident': return isActive && ticket.request_type === 'incident';
    case 'change_request': return isActive && ticket.request_type === 'change_request';
    case 'request_item': return isActive && ticket.request_type === 'request_item';
    case 'incident_in_progress': return ticket.request_type === 'incident' && ticket.status === 'in_progress';
    case 'change_in_progress': return ticket.request_type === 'change_request' && ticket.status === 'in_progress';
    case 'request_item_in_progress': return ticket.request_type === 'request_item' && ticket.status === 'in_progress';
    case 'p1': return isActive && ticket.impact === 'critical';
    case 'p2': return isActive && ticket.impact === 'high';
    case 'high_in_progress': return ticket.status === 'in_progress' && (ticket.impact === 'high' || ticket.impact === 'critical');
    case 'incident_replied': return isActive && ticket.request_type === 'incident' && customerRepliedIds.has(ticket.id);
    case 'change_replied': return isActive && ticket.request_type === 'change_request' && customerRepliedIds.has(ticket.id);
    case 'request_item_replied': return isActive && ticket.request_type === 'request_item' && customerRepliedIds.has(ticket.id);
    case 'resolved': return ticket.status === 'resolved' || ticket.status === 'closed';
    default: return true;
  }
}

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function exportTicketsCsv(tickets: SupportTicket[], filename: string) {
  const headers = ['Ticket Number', 'Subject', 'Restaurant', 'Requester Email', 'Request Type', 'Impact', 'Status', 'Submitted'];
  const rows = tickets.map(ticket => [
    ticket.request_number,
    ticket.subject,
    ticket.restaurant?.name,
    ticket.requester_email,
    ticketTypeLabels[ticket.request_type],
    impactLabels[ticket.impact],
    statusLabels[ticket.status],
    ticket.created_at ? new Date(ticket.created_at).toISOString() : '',
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\\r\\n');
  const blob = new Blob(['\\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getRequestedFilter(): TicketOverviewFilter | null {
  const value = new URLSearchParams(window.location.search).get('filter');
  return value && value in filterLabels ? value as TicketOverviewFilter : null;
}

export function TicketDashboard({ tickets, loading, error }: Props) {
  const [customerRepliedIds, setCustomerRepliedIds] = useState<Set<string>>(new Set());
  const [overviewCounts, setOverviewCounts] = useState<TicketOverviewCounts | null>(null);
  const [activeFilter, setActiveFilter] = useState<TicketOverviewFilter | null>(() => getRequestedFilter());
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatus, setCategoryStatus] = useState('all');
  const [categoryType, setCategoryType] = useState('all');
  const [categoryImpact, setCategoryImpact] = useState('all');

  useEffect(() => {
    const syncLocation = () => {
      setActiveFilter(getRequestedFilter());
      setCategorySearch('');
      setCategoryStatus('all');
      setCategoryType('all');
      setCategoryImpact('all');
    };
    window.addEventListener('popstate', syncLocation);
    return () => window.removeEventListener('popstate', syncLocation);
  }, []);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refreshCounts = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const counts = await getTicketOverviewCounts();
        if (active) setOverviewCounts(counts);
      } catch (countError) {
        console.error('Unable to load ticket overview counts from Supabase:', countError);
      } finally {
        refreshing = false;
      }
    };
    void refreshCounts();
    const channel = subscribeToTicketOverviewCounts(() => { void refreshCounts(); });
    return () => {
      active = false;
      void requireSupabase().removeChannel(channel);
    };
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

  const categoryQuery = categorySearch.trim().toLowerCase();
  const filteredTickets = activeFilter
    ? tickets.filter(ticket => matchesFilter(ticket, activeFilter, customerRepliedIds))
      .filter(ticket => !categoryQuery || [ticket.request_number, ticket.subject, ticket.description, ticket.restaurant?.name, ticket.requester_email, ticketTypeLabels[ticket.request_type]].some(value => value?.toLowerCase().includes(categoryQuery)))
      .filter(ticket => categoryStatus === 'all' || ticket.status === categoryStatus)
      .filter(ticket => categoryType === 'all' || ticket.request_type === categoryType)
      .filter(ticket => categoryImpact === 'all' || ticket.impact === categoryImpact)
    : [];
  const returnTo = window.location.pathname + window.location.search + window.location.hash;

  return (
    <section className="tickets-page">
      {activeFilter ? (
        <section className="filtered-ticket-view">
          <a className="filtered-ticket-close" href="./" aria-label="Close ticket category and return to overview" title="Close">×</a>
          <div className="page-heading">
            <div>
              <p className="eyebrow">CUSTOMER OPERATIONS</p>
              <h1>{filterLabels[activeFilter]}</h1>
              <p className="muted">Tickets matching this category. Select a ticket to view its details.</p>
            </div>
          </div>
          <div className="category-ticket-filters">
            <label className="category-ticket-search"><span aria-hidden="true">⌕</span><input type="search" value={categorySearch} onChange={event => setCategorySearch(event.target.value)} placeholder="Search tickets…" aria-label="Search tickets in this category" />{categorySearch && <button type="button" onClick={() => setCategorySearch('')} aria-label="Clear search">×</button>}</label>
            <label className="category-filter-select"><span className="sr-only">Filter by status</span><select value={categoryStatus} onChange={event => setCategoryStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="category-filter-select"><span className="sr-only">Filter by request type</span><select value={categoryType} onChange={event => setCategoryType(event.target.value)} aria-label="Filter by request type"><option value="all">All types</option>{Object.entries(ticketTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="category-filter-select"><span className="sr-only">Filter by impact</span><select value={categoryImpact} onChange={event => setCategoryImpact(event.target.value)} aria-label="Filter by impact"><option value="all">All impacts</option>{Object.entries(impactLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button className="category-export-button" type="button" onClick={() => exportTicketsCsv(filteredTickets, `web2table-${activeFilter}-tickets.csv`)} disabled={filteredTickets.length === 0} title="Export the tickets matching the current search and filters">
              <span aria-hidden="true">⇩</span> Export CSV
            </button>
          </div>
          <div className="category-ticket-results-toolbar">
            <p className="category-ticket-count">Showing {filteredTickets.length} of {tickets.filter(ticket => matchesFilter(ticket, activeFilter, customerRepliedIds)).length} tickets</p>
          </div>
          {error && <p className="filtered-ticket-message">{error}</p>}
          {loading && tickets.length === 0 ? <p className="filtered-ticket-message">Loading tickets…</p> :
            filteredTickets.length === 0 ? <p className="filtered-ticket-message">No tickets match this category.</p> : (
              <div className="filtered-ticket-list">
                {filteredTickets.map(ticket => (
                  <a className="filtered-ticket-row" href={`?filter=${encodeURIComponent(activeFilter)}&ticket=${encodeURIComponent(ticket.id)}&returnTo=${encodeURIComponent(returnTo)}`} key={ticket.id}>
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
        <TicketOverview tickets={tickets} counts={overviewCounts} />
      )}
    </section>
  );
}
