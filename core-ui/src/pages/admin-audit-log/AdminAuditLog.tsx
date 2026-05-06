import { useEffect, useMemo, useState } from 'react';

import {
	AdminActionButton,
	AdminPageHeader,
	AdminSectionCard,
} from '@/components/admin-ui';
import { AuditEvent, getAuditEvents } from '@/utils/audit-log';

const AdminAuditLog = () => {
	const [events, setEvents] = useState<AuditEvent[]>([]);
	const [search, setSearch] = useState('');
	const [actionFilter, setActionFilter] = useState('all');
	const [roleFilter, setRoleFilter] = useState('all');

	useEffect(() => {
		setEvents(getAuditEvents());
	}, []);

	const actionOptions = useMemo(() => {
		return Array.from(new Set(events.map((event) => event.action))).sort();
	}, [events]);

	const roleOptions = useMemo(() => {
		return Array.from(new Set(events.map((event) => event.role))).sort();
	}, [events]);

	const filteredEvents = useMemo(() => {
		return events.filter((event) => {
			const q = search.trim().toLowerCase();

			const matchesSearch =
				!q ||
				event.actor.toLowerCase().includes(q) ||
				event.entityName.toLowerCase().includes(q) ||
				event.details.toLowerCase().includes(q) ||
				event.action.toLowerCase().includes(q);

			const matchesAction =
				actionFilter === 'all' || event.action === actionFilter;

			const matchesRole = roleFilter === 'all' || event.role === roleFilter;

			return matchesSearch && matchesAction && matchesRole;
		});
	}, [events, search, actionFilter, roleFilter]);

	return (
		<div className="min-h-screen bg-[#F7F8FB] px-4 py-4">
			<div className="max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Audit Log"
					description="Track system actions, approval activity, and entity changes with one consistent audit trail."
				/>

				<AdminSectionCard className="mb-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#163F74] outline-none placeholder:text-[#98A2B3]"
							placeholder="Search actor, entity, action, or details"
						/>

						<select
							value={actionFilter}
							onChange={(event) => setActionFilter(event.target.value)}
							className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#163F74] outline-none"
						>
							<option value="all">All actions</option>
							{actionOptions.map((action) => (
								<option key={action} value={action}>
									{action}
								</option>
							))}
						</select>

						<select
							value={roleFilter}
							onChange={(event) => setRoleFilter(event.target.value)}
							className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#163F74] outline-none"
						>
							<option value="all">All roles</option>
							{roleOptions.map((role) => (
								<option key={role} value={role}>
									{role}
								</option>
							))}
						</select>

						<input
							readOnly
							value={`${filteredEvents.length} event(s)`}
							className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#5F6C86] outline-none"
						/>

						<AdminActionButton
							type="button"
							tone="primary"
							onClick={() => window.print()}
						>
							Export Audit Log
						</AdminActionButton>
					</div>
				</AdminSectionCard>

				<AdminSectionCard>
					<div className="overflow-x-auto">
						<table className="min-w-full border-separate border-spacing-y-3">
							<thead>
								<tr className="text-left text-sm text-[#98A2B3]">
									<th className="pb-2 font-medium uppercase tracking-[0.08em]">
										Timestamp
									</th>
									<th className="pb-2 font-medium uppercase tracking-[0.08em]">
										Actor
									</th>
									<th className="pb-2 font-medium uppercase tracking-[0.08em]">
										Role
									</th>
									<th className="pb-2 font-medium uppercase tracking-[0.08em]">
										Action
									</th>
									<th className="pb-2 font-medium uppercase tracking-[0.08em]">
										Entity Type
									</th>
									<th className="pb-2 font-medium uppercase tracking-[0.08em]">
										Entity Name
									</th>
									<th className="pb-2 font-medium uppercase tracking-[0.08em]">
										Details
									</th>
								</tr>
							</thead>

							<tbody>
								{filteredEvents.map((event) => (
									<tr
										key={event.id}
										className="rounded-[18px] bg-[#FCFDFE] text-sm text-[#163F74]"
									>
										<td className="rounded-l-2xl px-3 py-4">
											{new Date(event.timestamp).toLocaleString()}
										</td>
										<td className="px-3 py-4 font-medium">{event.actor}</td>
										<td className="px-3 py-4">{event.role}</td>
										<td className="px-3 py-4">{event.action}</td>
										<td className="px-3 py-4">{event.entityType}</td>
										<td className="px-3 py-4">{event.entityName}</td>
										<td className="rounded-r-[18px] px-3 py-4 text-[#5F6C86]">
											{event.details}
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{filteredEvents.length === 0 ? (
							<div className="py-10 text-center text-sm text-[#5F6C86]">
								No audit events recorded yet
							</div>
						) : null}
					</div>
				</AdminSectionCard>
			</div>
		</div>
	);
};

export default AdminAuditLog;
