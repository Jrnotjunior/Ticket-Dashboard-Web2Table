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

export function TicketDashboard({ tickets, onRefresh }: Props) {
  const [customerRepliedIds, setCustomerRepliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const loadCustomerReplies = async () => {
      try {
        const ids = await listCustomerRepliedTicketIds(tickets);
        if (active) {
          setCustomerRepliedIds(ids);
        }
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

