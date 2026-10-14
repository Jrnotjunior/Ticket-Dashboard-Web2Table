import {useCallback,useEffect} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import type {SupportTicket} from '../../domain/tickets/types';

/** Keeps the selected ticket in sync with the shareable ?ticket= URL. */
export function useTicketNavigation(
  tickets: SupportTicket[],
  setSelectedTicket: Dispatch<SetStateAction<SupportTicket|null>>,
) {
  useEffect(() => {
    const ticketId = new URLSearchParams(window.location.search).get('ticket');
    if (!ticketId) return;
    const match = tickets.find(ticket =>
      ticket.id === ticketId || ticket.request_number === ticketId
    );
    if (match) setSelectedTicket(match);
  }, [tickets, setSelectedTicket]);

  const closeTicket = useCallback(() => {
    setSelectedTicket(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('ticket');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, [setSelectedTicket]);

  return { closeTicket };
}
