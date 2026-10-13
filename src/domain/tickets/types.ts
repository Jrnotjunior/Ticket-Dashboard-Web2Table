export type TicketType = 'incident' | 'change_request' | 'request_item';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
export type TicketImpact = 'low' | 'normal' | 'high' | 'critical';
export type SupportTicket = { id:string; request_number:string|null; restaurant_id:string; requester_user_id:string; requester_email:string|null; request_type:TicketType; subject:string; description:string; impact:TicketImpact; status:TicketStatus; created_at:string; updated_at:string; restaurant?:{name:string;slug:string}|null };
export const ticketTypeLabels:Record<TicketType,string>={incident:'Incident',change_request:'Change Request',request_item:'Request Item'};
export const statusLabels:Record<TicketStatus,string>={open:'Open',in_progress:'In progress',resolved:'Resolved',closed:'Closed',cancelled:'Cancelled'};
export const impactLabels:Record<TicketImpact,string>={low:'Low',normal:'Normal',high:'High',critical:'Critical'};