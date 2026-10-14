create or replace view public.support_ticket_dashboard_counts with (security_invoker = true) as
with latest_public_message as (
  select distinct on (m.ticket_id) m.ticket_id, m.sender_user_id
  from public.support_ticket_messages m
  where m.visibility = 'public'
  order by m.ticket_id, m.created_at desc, m.id desc
), ticket_state as (
  select t.*,
    (t.status not in ('resolved', 'closed', 'cancelled')) as is_active,
    (lpm.sender_user_id = t.requester_user_id) as customer_waiting_for_support
  from public.restaurant_support_requests t
  left join latest_public_message lpm on lpm.ticket_id = t.id
)
select
  count(*)::bigint as all_tickets,
  count(*) filter (where status = 'in_progress' and impact in ('high', 'critical'))::bigint as high_in_progress,
  count(*) filter (where is_active and impact = 'critical')::bigint as p1,
  count(*) filter (where is_active and impact = 'high')::bigint as p2,
  count(*) filter (where is_active and request_type = 'incident')::bigint as incidents,
  count(*) filter (where is_active and request_type = 'change_request')::bigint as change_requests,
  count(*) filter (where is_active and request_type = 'request_item')::bigint as request_items,
  count(*) filter (where request_type = 'incident' and status = 'in_progress')::bigint as incidents_in_progress,
  count(*) filter (where request_type = 'change_request' and status = 'in_progress')::bigint as changes_in_progress,
  count(*) filter (where request_type = 'request_item' and status = 'in_progress')::bigint as request_items_in_progress,
  count(*) filter (where is_active and request_type = 'incident' and customer_waiting_for_support)::bigint as incidents_updated_by_customer,
  count(*) filter (where is_active and request_type = 'change_request' and customer_waiting_for_support)::bigint as changes_updated_by_customer,
  count(*) filter (where is_active and request_type = 'request_item' and customer_waiting_for_support)::bigint as request_items_updated_by_customer,
  count(*) filter (where status in ('resolved', 'closed'))::bigint as resolved_closed
from ticket_state;

grant select on public.support_ticket_dashboard_counts to authenticated;
