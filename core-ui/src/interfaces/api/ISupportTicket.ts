export type SupportTicketRole =
	| 'admin'
	| 'climateDeveloper'
	| 'wholesaleInvestor'
	| 'wealthManager';

export type SupportTicketCategory =
	| 'BUG'
	| 'PAYMENT'
	| 'ACCOUNT'
	| 'KYC'
	| 'WALLET'
	| 'DISTRIBUTION'
	| 'OTHER';

export type SupportTicketStatus =
	| 'OPEN'
	| 'IN_PROGRESS'
	| 'WAITING_ON_USER'
	| 'RESOLVED'
	| 'CLOSED';

export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ISupportTicketUser {
	id: number;
	fullName: string;
	email: string;
	type?: string;
	role?: string;
}

export interface ISupportTicket {
	id: number;
	uuid: string;
	userId: number;
	role: SupportTicketRole;
	category: SupportTicketCategory;
	subject: string;
	description: string;
	status: SupportTicketStatus;
	priority: SupportTicketPriority;
	attachmentUrl?: string | null;
	attachmentKey?: string | null;
	createdAt: string;
	updatedAt: string;
	resolvedAt?: string | null;
	assignedToUserId?: number | null;
	adminNotes?: string | null;
	user?: ISupportTicketUser | null;
	assignedToUser?: ISupportTicketUser | null;
}
