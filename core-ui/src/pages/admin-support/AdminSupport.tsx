import { useEffect, useMemo, useState } from 'react';

import {
	AdminActionButton,
	AdminDataTableShell,
	AdminFilterBar,
	AdminPageHeader,
	AdminStatCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import {
	ISupportTicket,
	SupportTicketCategory,
	SupportTicketPriority,
	SupportTicketRole,
	SupportTicketStatus,
} from '@/interfaces/api/ISupportTicket';
import { notificationService } from '@/services/notification.service';
import { supportService } from '@/services/support.service';
import { useUserStore } from '@/store/user.store';

const STATUS_OPTIONS: SupportTicketStatus[] = [
	'OPEN',
	'IN_PROGRESS',
	'WAITING_ON_USER',
	'RESOLVED',
	'CLOSED',
];

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

const ROLE_OPTIONS: SupportTicketRole[] = [
	'admin',
	'climateDeveloper',
	'wholesaleInvestor',
	'wealthManager',
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

function AdminSupportDetailModal({
	ticket,
	currentUserId,
	onClose,
	onRefresh,
}: {
	ticket: ISupportTicket | null;
	currentUserId?: number;
	onClose: () => void;
	onRefresh: () => Promise<void>;
}) {
	const [status, setStatus] = useState<SupportTicketStatus>('OPEN');
	const [note, setNote] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setStatus(ticket?.status || 'OPEN');
		setNote(ticket?.adminNotes || '');
	}, [ticket]);

	if (!ticket) return null;

	const saveChanges = async () => {
		try {
			setSaving(true);
			await supportService.updateStatus(ticket.id, status);
			await supportService.updateAdminNote(ticket.id, note);
			notificationService.success('Support ticket updated');
			await onRefresh();
			onClose();
		} catch (error) {
			console.error('Failed to update support ticket', error);
			notificationService.error('Failed to update support ticket');
		} finally {
			setSaving(false);
		}
	};

	const assignToMe = async () => {
		if (!currentUserId) return;
		try {
			setSaving(true);
			await supportService.assignTicket(ticket.id, currentUserId);
			await onRefresh();
			notificationService.success('Ticket assigned');
			onClose();
		} catch (error) {
			console.error('Failed to assign support ticket', error);
			notificationService.error('Failed to assign ticket');
		} finally {
			setSaving(false);
		}
	};

	const unassign = async () => {
		try {
			setSaving(true);
			await supportService.assignTicket(ticket.id, null);
			await onRefresh();
			notificationService.success('Ticket unassigned');
			onClose();
		} catch (error) {
			console.error('Failed to unassign support ticket', error);
			notificationService.error('Failed to unassign ticket');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4 py-6">
			<div className="w-full max-w-[860px] rounded-[22px] border border-[#E7ECF4] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
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
					<div className="rounded-[16px] border theme-border theme-card p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							User
						</div>
						<div className="mt-2 text-[15px] font-semibold theme-heading">
							{ticket.user?.fullName || 'Unknown user'}
						</div>
						<div className="mt-1 text-sm theme-text-secondary">
							{ticket.user?.email || '—'}
						</div>
					</div>

					<div className="rounded-[16px] border theme-border theme-card p-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Assigned To
						</div>
						<div className="mt-2 text-[15px] font-semibold theme-heading">
							{ticket.assignedToUser?.fullName || 'Unassigned'}
						</div>
						<div className="mt-1 text-sm theme-text-secondary">
							{ticket.assignedToUser?.email || 'No owner yet'}
						</div>
					</div>
				</div>

				<div className="mt-5 rounded-[18px] border theme-border theme-card p-5">
					<div className="text-[16px] font-semibold theme-heading">
						Description
					</div>
					<p className="mt-3 whitespace-pre-line text-sm leading-[1.6] theme-text-secondary">
						{ticket.description}
					</p>
				</div>

				<div className="mt-5 grid gap-4 md:grid-cols-2">
					<div>
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Status
						</label>
						<select
							value={status}
							onChange={(event) =>
								setStatus(event.target.value as SupportTicketStatus)
							}
							className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card px-4 theme-text"
						>
							{STATUS_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{labelize(option)}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
							Attachment
						</label>
						<div className="flex min-h-[50px] items-center rounded-[14px] border theme-border theme-card px-4 text-sm theme-text-secondary">
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

				<div className="mt-5">
					<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] theme-text-secondary">
						Internal Notes
					</label>
					<textarea
						value={note}
						onChange={(event) => setNote(event.target.value)}
						rows={6}
						className="w-full rounded-[14px] border theme-border theme-card px-4 py-3 theme-text outline-none"
						placeholder="Capture triage notes, next steps, or internal context."
					/>
				</div>

				<div className="mt-5 flex flex-wrap justify-between gap-3">
					<div className="flex flex-wrap gap-3">
						<AdminActionButton
							tone="secondary"
							onClick={() => void assignToMe()}
							disabled={saving || !currentUserId}
						>
							Assign to Me
						</AdminActionButton>
						<AdminActionButton
							tone="secondary"
							onClick={() => void unassign()}
							disabled={saving}
						>
							Unassign
						</AdminActionButton>
					</div>

					<AdminActionButton
						tone="primary"
						onClick={() => void saveChanges()}
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save Changes'}
					</AdminActionButton>
				</div>
			</div>
		</div>
	);
}

export default function AdminSupport() {
	const user = useUserStore((state) => state.user);
	const [tickets, setTickets] = useState<ISupportTicket[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedTicket, setSelectedTicket] = useState<ISupportTicket | null>(
		null,
	);
	const [statusFilter, setStatusFilter] = useState('all');
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [roleFilter, setRoleFilter] = useState('all');
	const [priorityFilter, setPriorityFilter] = useState('all');

	const loadTickets = async () => {
		try {
			setLoading(true);
			const rows = await supportService.getAdminTickets();
			setTickets(Array.isArray(rows) ? rows : []);
		} catch (error) {
			console.error('Failed to load admin support tickets', error);
			setTickets([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadTickets();
	}, []);

	const visibleTickets = useMemo(() => {
		return tickets.filter((ticket) => {
			const matchesStatus =
				statusFilter === 'all' || ticket.status === statusFilter;
			const matchesCategory =
				categoryFilter === 'all' || ticket.category === categoryFilter;
			const matchesRole = roleFilter === 'all' || ticket.role === roleFilter;
			const matchesPriority =
				priorityFilter === 'all' || ticket.priority === priorityFilter;
			return matchesStatus && matchesCategory && matchesRole && matchesPriority;
		});
	}, [tickets, statusFilter, categoryFilter, roleFilter, priorityFilter]);

	const summary = useMemo(
		() =>
			tickets.reduce(
				(acc, ticket) => {
					if (ticket.status === 'OPEN') acc.open += 1;
					if (ticket.status === 'IN_PROGRESS') acc.inProgress += 1;
					if (ticket.status === 'WAITING_ON_USER') acc.waiting += 1;
					if (ticket.priority === 'URGENT' || ticket.priority === 'HIGH') {
						acc.priority += 1;
					}
					return acc;
				},
				{ open: 0, inProgress: 0, waiting: 0, priority: 0 },
			),
		[tickets],
	);

	const openDetail = async (ticketId: number) => {
		try {
			const detail = await supportService.getTicket(ticketId);
			setSelectedTicket(detail || null);
		} catch (error) {
			console.error('Failed to load support ticket detail', error);
			notificationService.error('Failed to load support ticket detail');
		}
	};

	return (
		<div className="theme-page-shell min-h-screen px-4 py-4">
			<div className="w-full max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Support Tickets"
					description="Centralise issue triage, ownership, and internal notes so operational support is managed inside RegenX."
				/>

				<div className="mb-4 grid gap-4 md:grid-cols-4">
					<AdminStatCard label="Open" value={summary.open} />
					<AdminStatCard label="In Progress" value={summary.inProgress} />
					<AdminStatCard label="Waiting on User" value={summary.waiting} />
					<AdminStatCard label="High Priority" value={summary.priority} />
				</div>

				<AdminDataTableShell
					title="Support Queue"
					description="Structured platform support requests across investors, developers, and administrators."
					filters={
						<AdminFilterBar>
							<div className="grid flex-1 gap-3 md:grid-cols-4">
								<select
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="min-h-[50px] rounded-[14px] border theme-border theme-card px-4 theme-text"
								>
									<option value="all">All statuses</option>
									{STATUS_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{labelize(option)}
										</option>
									))}
								</select>
								<select
									value={categoryFilter}
									onChange={(event) => setCategoryFilter(event.target.value)}
									className="min-h-[50px] rounded-[14px] border theme-border theme-card px-4 theme-text"
								>
									<option value="all">All categories</option>
									{CATEGORY_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{labelize(option)}
										</option>
									))}
								</select>
								<select
									value={roleFilter}
									onChange={(event) => setRoleFilter(event.target.value)}
									className="min-h-[50px] rounded-[14px] border theme-border theme-card px-4 theme-text"
								>
									<option value="all">All roles</option>
									{ROLE_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{labelize(option)}
										</option>
									))}
								</select>
								<select
									value={priorityFilter}
									onChange={(event) => setPriorityFilter(event.target.value)}
									className="min-h-[50px] rounded-[14px] border theme-border theme-card px-4 theme-text"
								>
									<option value="all">All priorities</option>
									{PRIORITY_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{labelize(option)}
										</option>
									))}
								</select>
							</div>
						</AdminFilterBar>
					}
					loading={loading}
					loadingLabel="Loading support tickets..."
					isEmpty={visibleTickets.length === 0}
					emptyTitle="No support tickets in the queue"
					emptyDescription="User-reported issues will appear here once tickets are lodged inside the platform."
				>
					<table className="min-w-full border-separate border-spacing-y-3">
						<thead>
							<tr className="text-left text-sm theme-text-secondary">
								{[
									'Created',
									'User',
									'Role',
									'Category',
									'Subject',
									'Status',
									'Priority',
									'Assigned To',
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
							{visibleTickets.map((ticket) => (
								<tr key={ticket.id} className="theme-card text-sm theme-text">
									<td className="rounded-l-[18px] px-4 py-4">
										{formatDateTime(ticket.createdAt)}
									</td>
									<td className="px-4 py-4">
										<div className="font-semibold">
											{ticket.user?.fullName || 'Unknown user'}
										</div>
										<div className="text-xs theme-text-secondary">
											{ticket.user?.email || '—'}
										</div>
									</td>
									<td className="px-4 py-4">{labelize(ticket.role)}</td>
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
										{ticket.assignedToUser?.fullName || 'Unassigned'}
									</td>
									<td className="rounded-r-[18px] px-4 py-4">
										<AdminActionButton
											onClick={() => void openDetail(ticket.id)}
										>
											Open
										</AdminActionButton>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</AdminDataTableShell>
			</div>

			<AdminSupportDetailModal
				ticket={selectedTicket}
				currentUserId={user?.id ? Number(user.id) : undefined}
				onClose={() => setSelectedTicket(null)}
				onRefresh={loadTickets}
			/>
		</div>
	);
}
