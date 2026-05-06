import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
	AdminActionButton,
	AdminDataField,
	AdminEmptyState,
	AdminPageHeader,
	AdminSectionCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import {
	CustodyDetail,
	CustodyMode,
	CustodyParticipantType,
	CustodyQueueEntry,
	adminCustodyService,
} from '@/services/admin-custody.service';
import { notificationService } from '@/services/notification.service';

type QueueFilter =
	| 'all'
	| 'self_custody'
	| 'regenx_custody'
	| 'pending_requests'
	| 'incomplete_setup'
	| 'issuance_blocked'
	| 'ready';

function getCustodyErrorMessage(
	error: any,
	context: 'queue' | 'detail' | 'action',
) {
	const status = Number(error?.response?.status ?? 0);
	const backendError = error?.response?.data?.error;
	const backendMessage =
		backendError?.detail ??
		error?.response?.data?.message ??
		error?.response?.data;
	const fallbackMessage = error?.message;

	if (status === 404 && context === 'queue') {
		return 'Custody management is not available in this environment yet. Deploy the latest admin custody API routes and reload this page.';
	}

	if (status === 404 && context === 'detail') {
		return 'This custody review record is not available in this environment yet. Deploy the latest admin custody detail route and try again.';
	}

	if (typeof backendMessage === 'string' && backendMessage.trim()) {
		return backendMessage;
	}

	if (Array.isArray(backendMessage) && backendMessage.length > 0) {
		return String(backendMessage[0]);
	}

	if (typeof fallbackMessage === 'string' && fallbackMessage.trim()) {
		return fallbackMessage;
	}

	if (context === 'queue') {
		return 'Failed to load custody management queue.';
	}

	if (context === 'detail') {
		return 'Failed to load custody detail.';
	}

	return 'Action failed.';
}

function formatDateTime(value?: string | null) {
	if (!value) return '—';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return value;
	return parsed.toLocaleString();
}

function formatCustodyMode(value?: CustodyMode) {
	if (value === 'self_custody') return 'Self custody';
	if (value === 'regenx_custody') return 'RegenX custody';
	return 'Not set';
}

function formatStatusLabel(value?: string | null) {
	return String(value || 'none')
		.replaceAll('_', ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTone(value?: string | null): 'yellow' | 'pink' | 'blue' | 'gray' {
	switch (value) {
		case 'ready':
		case 'complete':
		case 'reviewed':
		case 'approved':
		case 'verified':
			return 'blue';
		case 'warning':
		case 'pending':
		case 'pending_review':
		case 'more_info_required':
		case 'managed':
			return 'yellow';
		case 'blocked':
		case 'invalid':
		case 'incomplete':
		case 'rejected':
		case 'issuance_blocked':
		case 'blocks_issuance':
			return 'pink';
		default:
			return 'gray';
	}
}

function getEntryKey(entry: {
	projectId: number;
	participantType: CustodyParticipantType;
	participantId: number;
}) {
	return `${entry.projectId}:${entry.participantType}:${entry.participantId}`;
}

export default function AdminCustodyManagement() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [queue, setQueue] = useState<CustodyQueueEntry[]>([]);
	const [detail, setDetail] = useState<CustodyDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [detailLoading, setDetailLoading] = useState(false);
	const [actionBusy, setActionBusy] = useState(false);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<QueueFilter>('all');
	const [adminNotes, setAdminNotes] = useState('');
	const [queueError, setQueueError] = useState<string | null>(null);
	const [detailError, setDetailError] = useState<string | null>(null);

	const selectedProjectId = searchParams.get('projectId');
	const selectedParticipantType = searchParams.get(
		'participantType',
	) as CustodyParticipantType | null;
	const selectedParticipantId = searchParams.get('participantId');

	const loadQueue = async () => {
		setLoading(true);
		setQueueError(null);
		try {
			const response = await adminCustodyService.getQueue();
			setQueue(response ?? []);
		} catch (error: any) {
			console.error('Failed to load custody queue', error);
			setQueueError(getCustodyErrorMessage(error, 'queue'));
			setQueue([]);
		} finally {
			setLoading(false);
		}
	};

	const loadDetail = async (
		projectId: string | number,
		participantType: CustodyParticipantType,
		participantId: string | number,
	) => {
		setDetailLoading(true);
		setDetailError(null);
		try {
			const response = await adminCustodyService.getDetail({
				projectId,
				participantType,
				participantId,
			});
			setDetail(response);
			setAdminNotes(response.relatedNotes.adminNotes ?? '');
		} catch (error: any) {
			console.error('Failed to load custody detail', error);
			setDetailError(getCustodyErrorMessage(error, 'detail'));
			setDetail(null);
		} finally {
			setDetailLoading(false);
		}
	};

	useEffect(() => {
		void loadQueue();
	}, []);

	useEffect(() => {
		if (selectedProjectId && selectedParticipantType && selectedParticipantId) {
			void loadDetail(
				selectedProjectId,
				selectedParticipantType,
				selectedParticipantId,
			);
			return;
		}

		setDetail(null);
		setDetailError(null);
		setAdminNotes('');
	}, [selectedParticipantId, selectedParticipantType, selectedProjectId]);

	const filteredQueue = useMemo(() => {
		return queue.filter((entry) => {
			const query = search.trim().toLowerCase();
			const matchesSearch =
				!query ||
				entry.projectName.toLowerCase().includes(query) ||
				entry.participantName.toLowerCase().includes(query) ||
				(entry.walletAddress || '').toLowerCase().includes(query) ||
				(entry.entityName || '').toLowerCase().includes(query);

			if (!matchesSearch) return false;

			switch (filter) {
				case 'self_custody':
					return entry.custodyMode === 'self_custody';
				case 'regenx_custody':
					return entry.custodyMode === 'regenx_custody';
				case 'pending_requests':
					return (
						entry.custodyChangeRequestStatus === 'pending' ||
						entry.custodyChangeRequestStatus === 'more_info_required'
					);
				case 'incomplete_setup':
					return (
						entry.custodySetupStatus === 'incomplete' ||
						entry.custodySetupStatus === 'not_started'
					);
				case 'issuance_blocked':
					return entry.issuanceReadinessImpact === 'blocks_issuance';
				case 'ready':
					return entry.issuanceReadinessImpact === 'ready';
				default:
					return true;
			}
		});
	}, [filter, queue, search]);

	const summary = useMemo(() => {
		return {
			total: queue.length,
			pending: queue.filter(
				(entry) =>
					entry.custodyChangeRequestStatus === 'pending' ||
					entry.custodyChangeRequestStatus === 'more_info_required',
			).length,
			blocked: queue.filter(
				(entry) => entry.issuanceReadinessImpact === 'blocks_issuance',
			).length,
			ready: queue.filter((entry) => entry.issuanceReadinessImpact === 'ready')
				.length,
		};
	}, [queue]);

	const handleSelect = (entry: CustodyQueueEntry) => {
		setSearchParams({
			projectId: String(entry.projectId),
			participantType: entry.participantType,
			participantId: String(entry.participantId),
		});
	};

	const refreshSelected = async () => {
		await loadQueue();
		if (detail) {
			await loadDetail(
				detail.projectId,
				detail.participantType,
				detail.participantId,
			);
		}
	};

	const handleRequestDecision = async (
		status: 'approved' | 'rejected' | 'more_info_required',
	) => {
		const request = detail?.requests?.[0];
		if (!request) return;
		setActionBusy(true);
		try {
			await adminCustodyService.reviewRequest(request.id, {
				status,
				adminNotes:
					adminNotes.trim() ||
					`Custody request ${formatStatusLabel(status)} by admin.`,
			});
			notificationService.success(
				`Custody request ${formatStatusLabel(status).toLowerCase()}.`,
			);
			await refreshSelected();
		} catch (error: any) {
			notificationService.error(getCustodyErrorMessage(error, 'action'));
		} finally {
			setActionBusy(false);
		}
	};

	const handleMarkReviewed = async () => {
		if (!detail) return;
		setActionBusy(true);
		try {
			await adminCustodyService.markProjectReviewed(
				detail.projectId,
				adminNotes.trim() || undefined,
			);
			notificationService.success('Custody setup marked as reviewed.');
			await refreshSelected();
		} catch (error: any) {
			notificationService.error(getCustodyErrorMessage(error, 'action'));
		} finally {
			setActionBusy(false);
		}
	};

	const handleBlockIssuance = async () => {
		if (!detail) return;
		setActionBusy(true);
		try {
			await adminCustodyService.blockIssuance(detail.projectId, {
				reason: adminNotes.trim() || 'Custody prerequisites are not satisfied.',
				adminNotes: adminNotes.trim() || undefined,
			});
			notificationService.success('Issuance blocked by custody review.');
			await refreshSelected();
		} catch (error: any) {
			notificationService.error(getCustodyErrorMessage(error, 'action'));
		} finally {
			setActionBusy(false);
		}
	};

	const handleClearBlock = async () => {
		if (!detail) return;
		setActionBusy(true);
		try {
			await adminCustodyService.clearIssuanceBlock(
				detail.projectId,
				adminNotes.trim() || undefined,
			);
			notificationService.success('Custody issuance block cleared.');
			await refreshSelected();
		} catch (error: any) {
			notificationService.error(getCustodyErrorMessage(error, 'action'));
		} finally {
			setActionBusy(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#F7F8FB] px-4 py-4">
			<div className="max-w-[1380px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Custody Management"
					description="Review custody setup, validate wallet compatibility, and manage issuance-impacting custody decisions."
				/>

				<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
					<AdminSectionCard>
						<div className="text-[12px] font-medium text-[#667085]">
							Total rows
						</div>
						<div className="mt-2 text-[28px] font-semibold text-[#163F74]">
							{summary.total}
						</div>
					</AdminSectionCard>
					<AdminSectionCard>
						<div className="text-[12px] font-medium text-[#667085]">
							Pending requests
						</div>
						<div className="mt-2 text-[28px] font-semibold text-[#163F74]">
							{summary.pending}
						</div>
					</AdminSectionCard>
					<AdminSectionCard>
						<div className="text-[12px] font-medium text-[#667085]">
							Issuance blocked
						</div>
						<div className="mt-2 text-[28px] font-semibold text-[#163F74]">
							{summary.blocked}
						</div>
					</AdminSectionCard>
					<AdminSectionCard>
						<div className="text-[12px] font-medium text-[#667085]">Ready</div>
						<div className="mt-2 text-[28px] font-semibold text-[#163F74]">
							{summary.ready}
						</div>
					</AdminSectionCard>
				</div>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
					<AdminSectionCard>
						<div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								className="rounded-[18px] border border-[#E6ECF5] bg-white px-4 py-3 text-sm text-[#101828] outline-none placeholder:text-[#98A2B3]"
								placeholder="Search project, participant, wallet, or entity"
							/>
							<select
								value={filter}
								onChange={(event) =>
									setFilter(event.target.value as QueueFilter)
								}
								className="rounded-[18px] border border-[#E6ECF5] bg-white px-4 py-3 text-sm text-[#101828] outline-none"
							>
								<option value="all">All</option>
								<option value="self_custody">Self custody</option>
								<option value="regenx_custody">RegenX custody</option>
								<option value="pending_requests">
									Pending change requests
								</option>
								<option value="incomplete_setup">Incomplete setup</option>
								<option value="issuance_blocked">Issuance blocked</option>
								<option value="ready">Ready</option>
							</select>
							<AdminActionButton
								tone="secondary"
								className="justify-center"
								onClick={() => void loadQueue()}
							>
								Refresh Queue
							</AdminActionButton>
						</div>

						{loading ? (
							<div className="py-12 text-sm text-[#667085]">
								Loading custody queue...
							</div>
						) : queueError ? (
							<AdminEmptyState
								title="Custody management unavailable"
								description={queueError}
							/>
						) : filteredQueue.length === 0 ? (
							<AdminEmptyState
								title="No custody rows matched"
								description="Adjust the current filters or search to view more custody records."
							/>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-[#EEF2F7] text-left text-[#98A2B3]">
											<th className="pb-4 pr-4 font-medium">Project</th>
											<th className="px-3 pb-4 font-medium">Type</th>
											<th className="px-3 pb-4 font-medium">Participant</th>
											<th className="px-3 pb-4 font-medium">Custody</th>
											<th className="px-3 pb-4 font-medium">Wallet</th>
											<th className="px-3 pb-4 font-medium">Setup</th>
											<th className="px-3 pb-4 font-medium">Request</th>
											<th className="px-3 pb-4 font-medium">Impact</th>
											<th className="pl-3 pb-4 font-medium">Action</th>
										</tr>
									</thead>
									<tbody>
										{filteredQueue.map((entry) => {
											const selected =
												selectedProjectId === String(entry.projectId) &&
												selectedParticipantType === entry.participantType &&
												selectedParticipantId === String(entry.participantId);
											return (
												<tr
													key={getEntryKey(entry)}
													className={`border-b border-[#F0F3F8] ${
														selected ? 'bg-[#F8FBFF]' : 'bg-transparent'
													}`}
												>
													<td className="py-4 pr-4 align-top">
														<div className="font-medium text-[#163F74]">
															{entry.projectName}
														</div>
														{entry.entityName ? (
															<div className="mt-1 text-xs text-[#667085]">
																{entry.entityName}
															</div>
														) : null}
													</td>
													<td className="px-3 py-4 align-top text-[#344054]">
														{formatStatusLabel(entry.participantType)}
													</td>
													<td className="px-3 py-4 align-top text-[#344054]">
														{entry.participantName}
													</td>
													<td className="px-3 py-4 align-top">
														<AdminStatusBadge
															label={formatCustodyMode(entry.custodyMode)}
															tone={getTone(entry.custodyMode)}
														/>
													</td>
													<td className="px-3 py-4 align-top">
														<div className="max-w-[170px] break-all text-[#344054]">
															{entry.walletAddress || '—'}
														</div>
														<div className="mt-2">
															<AdminStatusBadge
																label={formatStatusLabel(entry.walletStatus)}
																tone={getTone(entry.walletStatus)}
															/>
														</div>
													</td>
													<td className="px-3 py-4 align-top">
														<AdminStatusBadge
															label={formatStatusLabel(
																entry.custodySetupStatus,
															)}
															tone={getTone(entry.custodySetupStatus)}
														/>
													</td>
													<td className="px-3 py-4 align-top">
														<AdminStatusBadge
															label={formatStatusLabel(
																entry.custodyChangeRequestStatus,
															)}
															tone={getTone(entry.custodyChangeRequestStatus)}
														/>
													</td>
													<td className="px-3 py-4 align-top">
														<AdminStatusBadge
															label={formatStatusLabel(
																entry.issuanceReadinessImpact,
															)}
															tone={getTone(entry.issuanceReadinessImpact)}
														/>
													</td>
													<td className="pl-3 py-4 align-top">
														<AdminActionButton
															tone={selected ? 'primary' : 'secondary'}
															onClick={() => handleSelect(entry)}
														>
															Review
														</AdminActionButton>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</AdminSectionCard>

					<AdminSectionCard>
						{detailLoading ? (
							<div className="py-12 text-sm text-[#667085]">
								Loading custody detail...
							</div>
						) : detailError ? (
							<AdminEmptyState
								title="Custody detail unavailable"
								description={detailError}
							/>
						) : !detail ? (
							<AdminEmptyState
								title="Choose a custody row"
								description="Select a project or participant from the queue to review custody status, readiness, and actions."
							/>
						) : (
							<div className="space-y-5">
								<div className="flex items-start justify-between gap-4">
									<div>
										<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
											{detail.linkedProject.name}
										</div>
										<h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#163F74]">
											{detail.participantName}
										</h2>
										<div className="mt-2 flex flex-wrap gap-2">
											<AdminStatusBadge
												label={formatCustodyMode(detail.currentCustodyMode)}
												tone={getTone(detail.currentCustodyMode)}
											/>
											<AdminStatusBadge
												label={formatStatusLabel(
													detail.custodySetupCompleteness,
												)}
												tone={getTone(detail.custodySetupCompleteness)}
											/>
											<AdminStatusBadge
												label={formatStatusLabel(
													detail.issuanceReadinessImpact,
												)}
												tone={getTone(detail.issuanceReadinessImpact)}
											/>
										</div>
									</div>
									<AdminActionButton
										tone="secondary"
										onClick={() =>
											navigate(`/admin/project-approvals/${detail.projectId}`)
										}
									>
										Open Project
									</AdminActionButton>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<AdminDataField
										label="Current custody mode"
										value={formatCustodyMode(detail.currentCustodyMode)}
									/>
									<AdminDataField
										label="Requested custody mode"
										value={formatCustodyMode(detail.requestedCustodyMode)}
									/>
									<AdminDataField
										label="Participant type"
										value={formatStatusLabel(detail.participantType)}
									/>
									<AdminDataField
										label="Wallet verification"
										value={formatStatusLabel(detail.walletVerificationState)}
									/>
									<AdminDataField
										label="Requested by"
										value={detail.whoRequestedChange || '—'}
									/>
									<AdminDataField
										label="Request status"
										value={formatStatusLabel(detail.requestedChangeStatus)}
									/>
								</div>

								<AdminSectionCard className="bg-[#FCFDFE]">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										{Object.entries(detail.relatedWalletAddresses).map(
											([key, value]) => (
												<AdminDataField
													key={key}
													label={formatStatusLabel(key)}
													value={value || '—'}
												/>
											),
										)}
									</div>
								</AdminSectionCard>

								<div>
									<div className="text-sm font-medium text-[#163F74]">
										Blocking reasons
									</div>
									<div className="mt-3 space-y-2">
										{detail.blockingReasons.length === 0 ? (
											<div className="rounded-[16px] border border-[#E6ECF5] bg-white px-4 py-3 text-sm text-[#667085]">
												No custody blocking reasons are active.
											</div>
										) : (
											detail.blockingReasons.map((reason) => (
												<div
													key={reason}
													className="rounded-[16px] border border-[#F7D1D8] bg-[#FFF7F8] px-4 py-3 text-sm text-[#7A263A]"
												>
													{reason}
												</div>
											))
										)}
									</div>
								</div>

								{detail.warnings.length > 0 ? (
									<div>
										<div className="text-sm font-medium text-[#163F74]">
											Warnings
										</div>
										<div className="mt-3 space-y-2">
											{detail.warnings.map((warning) => (
												<div
													key={warning}
													className="rounded-[16px] border border-[#FDE7B4] bg-[#FFFBEF] px-4 py-3 text-sm text-[#8A5A00]"
												>
													{warning}
												</div>
											))}
										</div>
									</div>
								) : null}

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<AdminDataField
										label="Request reason"
										value={detail.reasonForCustodyChangeRequest || '—'}
									/>
									<AdminDataField
										label="Issuance status"
										value={formatStatusLabel(
											detail.linkedIssuanceStatus.issuanceStatus,
										)}
									/>
									<AdminDataField
										label="Requested at"
										value={formatDateTime(detail.timestamps.requestedAt)}
									/>
									<AdminDataField
										label="Reviewed at"
										value={formatDateTime(detail.timestamps.reviewedAt)}
									/>
									<AdminDataField
										label="Admin notes"
										value={detail.relatedNotes.adminNotes || '—'}
									/>
									<AdminDataField
										label="Custody block reason"
										value={detail.relatedNotes.custodyBlockReason || '—'}
									/>
								</div>

								<div>
									<label className="mb-2 block text-sm font-medium text-[#163F74]">
										Admin notes
									</label>
									<textarea
										value={adminNotes}
										onChange={(event) => setAdminNotes(event.target.value)}
										className="min-h-[120px] w-full rounded-[18px] border border-[#E6ECF5] bg-white px-4 py-3 text-sm text-[#101828] outline-none"
										placeholder="Add decision notes, review observations, or a custody block reason."
									/>
								</div>

								<div className="flex flex-wrap gap-3">
									{detail.requests.length > 0 &&
									(detail.requestedChangeStatus === 'pending' ||
										detail.requestedChangeStatus === 'more_info_required') ? (
										<>
											<AdminActionButton
												tone="primary"
												onClick={() => void handleRequestDecision('approved')}
												disabled={actionBusy}
											>
												Approve Change
											</AdminActionButton>
											<AdminActionButton
												tone="danger"
												onClick={() => void handleRequestDecision('rejected')}
												disabled={actionBusy}
											>
												Reject Change
											</AdminActionButton>
											<AdminActionButton
												tone="secondary"
												onClick={() =>
													void handleRequestDecision('more_info_required')
												}
												disabled={actionBusy}
											>
												Request More Info
											</AdminActionButton>
										</>
									) : null}
									<AdminActionButton
										tone="secondary"
										onClick={() => void handleMarkReviewed()}
										disabled={
											actionBusy || detail.participantType !== 'project'
										}
									>
										Mark Reviewed
									</AdminActionButton>
									<AdminActionButton
										tone="danger"
										onClick={() => void handleBlockIssuance()}
										disabled={
											actionBusy || detail.participantType !== 'project'
										}
									>
										Block Issuance
									</AdminActionButton>
									<AdminActionButton
										tone="secondary"
										onClick={() => void handleClearBlock()}
										disabled={
											actionBusy || detail.participantType !== 'project'
										}
									>
										Clear Block
									</AdminActionButton>
								</div>

								{detail.requests.length > 0 ? (
									<div>
										<div className="text-sm font-medium text-[#163F74]">
											Request history
										</div>
										<div className="mt-3 space-y-3">
											{detail.requests.map((request) => (
												<div
													key={request.id}
													className="rounded-[18px] border border-[#E6ECF5] bg-white px-4 py-4"
												>
													<div className="flex flex-wrap items-center justify-between gap-2">
														<div className="font-medium text-[#163F74]">
															{formatCustodyMode(request.currentCustodyMode)} to{' '}
															{formatCustodyMode(request.requestedCustodyMode)}
														</div>
														<AdminStatusBadge
															label={formatStatusLabel(request.status)}
															tone={getTone(request.status)}
														/>
													</div>
													<div className="mt-2 text-sm text-[#475467]">
														{request.reason}
													</div>
													<div className="mt-2 text-xs text-[#98A2B3]">
														Requested {formatDateTime(request.requestedAt)}
													</div>
													{request.adminNotes ? (
														<div className="mt-2 text-xs text-[#667085]">
															Admin notes: {request.adminNotes}
														</div>
													) : null}
												</div>
											))}
										</div>
									</div>
								) : null}
							</div>
						)}
					</AdminSectionCard>
				</div>
			</div>
		</div>
	);
}
