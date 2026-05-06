import { SupportTicketStatus } from '../../infrastructure/persistence/entities/support-ticket.entity';

export class UpdateSupportTicketStatusDto {
  status: SupportTicketStatus;
}
