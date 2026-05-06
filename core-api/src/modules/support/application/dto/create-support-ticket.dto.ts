import {
  SupportTicketCategory,
  SupportTicketPriority,
} from '../../infrastructure/persistence/entities/support-ticket.entity';

export class CreateSupportTicketDto {
  category: SupportTicketCategory;
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
}
