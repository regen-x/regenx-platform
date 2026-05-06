import { AlertCircle, Paperclip } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
	AdminActionButton,
	AdminDataTableShell,
	AdminFilterBar,
	AdminSectionCard,
	AdminStatCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import AppPageHeader from '@/components/layout/AppPageHeader';
import AppPageShell from '@/components/layout/AppPageShell';
import {
	ISupportTicket,
	SupportTicketCategory,
	SupportTicketPriority,
	SupportTicketStatus,
} from '@/interfaces/api/ISupportTicket';
import { notificationService } from '@/services/notification.service';
import { supportService } from '@/services/support.service';
import { useUserStore } from '@/store/user.store';

const CATEGORY_OPTIONS: SupportTicketCategory[] = [
	'BUG',
	'PAYMENT',
	'ACCOUNT',
	'KYC',
	'WALLET',
	'DISTRIBUTION',
	'OTHER',
];

const PRIORITY_OPTIONS: SupportTicketPriority[] = [
	'LOW',
	'MEDIUM',
	'HIGH',
	'URGENT',
];

const formatDateTime = (value?: string | null) =>
	value ? new Date(value).toLocaleString() : '—';

const labelize = (value?: string | null) =>
	String(value || '')
		.replaceAll('_', ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase());

const statusTone = (status?: SupportTicketStatus) => {
	if (status === 'RESOLVED' || status === 'CLOSED') return 'blue' as const;
	if (status === 'WAITING_ON_USER') return 'yellow' as const;
	if (status === 'IN_PROGRESS') return 'yellow' as const;
	return 'gray' as const;
};

const priorityTone = (priority?: SupportTicketPriority) => {
	if (priority === 'URGENT') return 'pink' as const;
	if (priority === 'HIGH') return 'yellow' as const;
	if (priority === 'MEDIUM') return 'blue' as const;
	return 'gray' as const;
};

function TicketDetailModal({
	ticket,
	onClose,
}: {
	ticket: ISupportTicket | null;
	onClose: () => void;
}) {
	if (!ticket) return null;

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4 py-6">
			<div className="w-full max-w-[760px] rounded-[22px] border border-[#E7ECF4] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="theme-eyebrow inline-flex rounded-[8px] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
							Support Ticket
						</div>
						<h2 className="mt-3 theme-heading text-[24px] font-semibold tracking-[-0.03em]">
							{ticket.subject}
						</h2>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<AdminStatusBadge
								label={labelize(ticket.status)}
								tone={statusTone(ticket.status)}
							/>
							<AdminStatusBadge
								label={labelize(ticket.priority)}
								tone={priorityTone(ticket.priority)}
							/>
						</div>
					</div>

					<AdminActionButton onClick={onClose}>Close</AdminActionButton>
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-2">
					<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Created
						</div>
						<div className="mt-2 text-[15px] font-semibold theme-heading">
							{formatDateTime(ticket.createdAt)}
						</div>
					</div>
					<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Last Updated
						</div>
						<div className="mt-2 text-[15px] font-semibold theme-heading">
							{formatDateTime(ticket.updatedAt)}
						</div>
					</div>
				</div>

				<div className="mt-5 rounded-[18px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="text-[16px] font-semibold theme-heading">
						Description
					</div>
					<p className="mt-3 whitespace-pre-line text-sm leading-[1.6] theme-text-secondary">
						{ticket.description}
					</p>
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-2">
					<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Category
						</div>
						<div className="mt-2 text-[15px] font-semibold theme-heading">
							{labelize(ticket.category)}
						</div>
					</div>
					<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Attachment
						</div>
						<div className="mt-2 text-sm theme-text-secondary">
							{ticket.attachmentUrl ? (
								<a
									href={ticket.attachmentUrl}
									target="_blank"
									rel="noreferrer"
									className="font-semibold text-[#2F80ED]"
								>
									Open attachment
								</a>
							) : (
								'No attachment provided'
							)}
						</div>
					</div>
				</div>

				<div className="mt-5 rounded-[18px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4 text-[#2F80ED]" />
						<div className="text-[16px] font-semibold theme-heading">
							Support Response
						</div>
					</div>
					<p className="mt-3 whitespace-pre-line text-sm leading-[1.6] theme-text-secondary">
						{ticket.adminNotes || 'No admin response notes yet.'}
					</p>
				</div>
			</div>
		</div>
	);
}

export default function Support() {
	const user = useUserStore((state) => state.user);
	const [tickets, setTickets] = useState<ISupportTicket[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState<ISupportTicket | null>(
		null,
	);
	const [subject, setSubject] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<SupportTicketCategory>('BUG');
	const [priority, setPriority] = useState<SupportTicketPriority>('MEDIUM');
	const [attachment, setAttachment] = useState<File | null>(null);

	const loadTickets = async () => {
		try {
			setLoading(true);
			const rows = await supportService.getMyTickets();
			setTickets(Array.isArray(rows) ? rows : []);
		} catch (error) {
			console.error('Failed to load support tickets', error);
			setTickets([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadTickets();
	}, []);

	const openDetail = async (ticketId: number) => {
		try {
			const detail = await supportService.getTicket(ticketId);
			setSelectedTicket(detail || null);
		} catch (error) {
			console.error('Failed to load support ticket detail', error);
			notificationService.error('Failed to load ticket detail');
		}
	};

	const summary = useMemo(
		() =>
			tickets.reduce(
				(acc, ticket) => {
					if (ticket.status === 'OPEN') acc.open += 1;
					if (ticket.status === 'IN_PROGRESS') acc.inProgress += 1;
					if (ticket.status === 'WAITING_ON_USER') acc.waiting += 1;
					if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
						acc.resolved += 1;
					}
					return acc;
				},
				{ open: 0, inProgress: 0, waiting: 0, resolved: 0 },
			),
		[tickets],
	);

	const handleCreateTicket = async () => {
		if (!subject.trim() || !description.trim()) {
			notificationService.error('Please complete subject and description');
			return;
		}

		try {
			setSubmitting(true);
			await supportService.createTicket({
				category,
				subject,
				description,
				priority,
				attachment,
			});
			notificationService.success('Support ticket created');
			setSubject('');
			setDescription('');
			setCategory('BUG');
			setPriority('MEDIUM');
			setAttachment(null);
			await loadTickets();
		} catch (error) {
			console.error('Failed to create support ticket', error);
			notificationService.error('Failed to create support ticket');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AppPageShell>
			<AppPageHeader
				eyebrow={
					user?.type === 'climateDeveloper'
						? 'Climate Developer Portal'
						: 'Investor Portal'
				}
				title="Support"
				description="Lodge platform issues, payment questions, or account problems directly inside RegenX and track progress without leaving the portal."
			/>

			<div className="mb-4 grid gap-4 md:grid-cols-4">
				<AdminStatCard label="Open" value={summary.open} />
				<AdminStatCard label="In Progress" value={summary.inProgress} />
				<AdminStatCard label="Waiting on You" value={summary.waiting} />
				<AdminStatCard label="Resolved" value={summary.resolved} />
			</div>

			<AdminSectionCard
				title="Create Ticket"
				description="Capture enough detail for the operations team to triage the issue without relying on email threads."
			>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Category
						</label>
						<select
							value={category}
							onChange={(event) =>
								setCategory(event.target.value as SupportTicketCategory)
							}
							className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card px-4 theme-text"
						>
							{CATEGORY_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{labelize(option)}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Priority
						</label>
						<select
							value={priority}
							onChange={(event) =>
								setPriority(event.target.value as SupportTicketPriority)
							}
							className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card px-4 theme-text"
						>
							{PRIORITY_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{labelize(option)}
								</option>
							))}
						</select>
					</div>

					<div className="md:col-span-2">
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Subject
						</label>
						<input
							value={subject}
							onChange={(event) => setSubject(event.target.value)}
							placeholder="Summarise the issue clearly"
							className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card px-4 theme-text outline-none"
						/>
					</div>

					<div className="md:col-span-2">
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Description
						</label>
						<textarea
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							rows={6}
							placeholder="Describe what happened, what you expected, and any steps to reproduce the issue."
							className="w-full rounded-[14px] border theme-border theme-card px-4 py-3 theme-text outline-none"
						/>
					</div>

					<div className="md:col-span-2">
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Attachment
						</label>
						<label className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-[14px] border theme-border theme-card px-4">
							<Paperclip className="h-4 w-4 theme-text-secondary" />
							<span className="text-sm theme-text-secondary">
								{attachment?.name || 'Attach screenshot or supporting file'}
							</span>
							<input
								type="file"
								className="hidden"
								onChange={(event) =>
									setAttachment(event.target.files?.[0] || null)
								}
							/>
						</label>
					</div>
				</div>

				<div className="mt-5 flex justify-end">
					<AdminActionButton
						tone="primary"
						onClick={() => void handleCreateTicket()}
						disabled={submitting}
					>
						{submitting ? 'Submitting...' : 'Submit Ticket'}
					</AdminActionButton>
				</div>
			</AdminSectionCard>

			<AdminDataTableShell
				title="My Tickets"
				description="Track the status of issues you have raised without needing to chase support through email."
				className="mt-4"
				filters={
					<AdminFilterBar>
						<div className="text-sm theme-text-secondary">
							{tickets.length} ticket{tickets.length === 1 ? '' : 's'} logged
						</div>
					</AdminFilterBar>
				}
				loading={loading}
				loadingLabel="Loading support tickets..."
				isEmpty={tickets.length === 0}
				emptyTitle="No support tickets yet"
				emptyDescription="When you report an issue, its lifecycle and support notes will appear here."
			>
				<table className="min-w-full border-separate border-spacing-y-3">
					<thead>
						<tr className="text-left text-sm theme-text-secondary">
							{[
								'Created',
								'Category',
								'Subject',
								'Status',
								'Priority',
								'Last Updated',
								'Action',
							].map((heading) => (
								<th
									key={heading}
									className="pb-2 font-medium uppercase tracking-[0.08em]"
								>
									{heading}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{tickets.map((ticket) => (
							<tr key={ticket.id} className="theme-card text-sm theme-text">
								<td className="rounded-l-[18px] px-4 py-4">
									{formatDateTime(ticket.createdAt)}
								</td>
								<td className="px-4 py-4">{labelize(ticket.category)}</td>
								<td className="px-4 py-4 font-semibold">{ticket.subject}</td>
								<td className="px-4 py-4">
									<AdminStatusBadge
										label={labelize(ticket.status)}
										tone={statusTone(ticket.status)}
									/>
								</td>
								<td className="px-4 py-4">
									<AdminStatusBadge
										label={labelize(ticket.priority)}
										tone={priorityTone(ticket.priority)}
									/>
								</td>
								<td className="px-4 py-4">
									{formatDateTime(ticket.updatedAt)}
								</td>
								<td className="rounded-r-[18px] px-4 py-4">
									<AdminActionButton onClick={() => void openDetail(ticket.id)}>
										View Details
									</AdminActionButton>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</AdminDataTableShell>
			<TicketDetailModal
				ticket={selectedTicket}
				onClose={() => setSelectedTicket(null)}
			/>
		</AppPageShell>
	);
}
