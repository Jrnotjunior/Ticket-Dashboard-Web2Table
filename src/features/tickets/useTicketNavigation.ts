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
    const url = new URL(window.location.href);
    const returnTo = url.searchParams.get('returnTo');
    setSelectedTicket(null);

    // Ticket links record their originating list/search URL so closing returns
    // to exactly that view, including its category and search query.
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      window.location.assign(returnTo);
      return;
    }

    // Directly opened ticket URLs have no originating page; remove ticket
    // parameters and keep any category/search context present in the URL.
    url.searchParams.delete('ticket');
    url.searchParams.delete('returnTo');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, [setSelectedTicket]);

  return { closeTicket };
}
