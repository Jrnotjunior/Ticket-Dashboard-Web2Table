import { useEffect, useState } from 'react';
import type { SupportTicket } from '../../domain/tickets/types';

import { listCustomerRepliedTicketIds, subscribeToCustomerReplies } from '../../domain/tickets/customerReplyService';
import { requireSupabase } from '../../lib/supabase';
import { TicketOverview } from './overview/TicketOverview';

type Props = {
  tickets: SupportTicket[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onSelect: (ticket: SupportTicket) => void;
};

export function TicketDashboard({ tickets, loading, error, onRefresh, onSelect }: Props) {
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
      />



    </section>
  );
}

