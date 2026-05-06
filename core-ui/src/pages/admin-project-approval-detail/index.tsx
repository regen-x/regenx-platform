import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ProjectSetup from '../project-setup/ProjectSetup';

import {
	AdminActionButton,
	AdminDataField,
	AdminSectionCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import RevenueParticipationAgreementModal, {
	RevenueParticipationAgreementContent,
	type RpaSummary,
} from '@/components/rpa/RevenueParticipationAgreementModal';
import { IProject } from '@/interfaces/api/IProject';
import { entitySpvAdminService } from '@/services/entity-spv-admin.service';
import { notificationService } from '@/services/notification.service';
import { projectService } from '@/services/project.service';

type ProjectStatus =
	| 'draft'
	| 'under_review'
	| 'changes_requested'
	| 'approved'
	| 'issued'
	| 'live'
	| 'locked';

type EntitySpvSummary = Awaited<
	ReturnType<typeof entitySpvAdminService.getProjectEntitySpvSummary>
>;

const getTone = (
	status?: string | null,
): 'yellow' | 'pink' | 'blue' | 'gray' => {
	switch (status) {
		case 'approved':
		case 'ready':
		case 'issued':
		case 'live':
			return 'blue';
		case 'under_review':
		case 'draft':
		case 'suggested':
			return 'yellow';
		case 'blocked':
		case 'changes_requested':
		case 'locked':
		case 'rejected':
			return 'pink';
		default:
			return 'gray';
	}
};

const formatProjectName = (project?: IProject | null) => {
	const payload = (project?.payloadJson ?? {}) as Record<string, any>;
	const form = (payload.form ?? payload) as Record<string, any>;

	return (
		form.projectName ??
		project?.name ??
		(project?.id ? `Project ${project.id}` : 'Project Review')
	);
};

const formatProjectType = (project?: IProject | null) => {
	const payload = (project?.payloadJson ?? {}) as Record<string, any>;
	const form = (payload.form ?? payload) as Record<string, any>;
	return form.projectType ?? project?.projectType ?? '—';
};

const formatProjectStage = (project?: IProject | null) => {
	const payload = (project?.payloadJson ?? {}) as Record<string, any>;
	const form = (payload.form ?? payload) as Record<string, any>;
	return form.stage ?? project?.stage ?? '—';
};

const formatJurisdiction = (project?: IProject | null) => {
	const payload = (project?.payloadJson ?? {}) as Record<string, any>;
	const form = (payload.form ?? payload) as Record<string, any>;
	return form.jurisdiction ?? project?.jurisdiction ?? '—';
};

const getProjectField = (
	project: IProject | null | undefined,
	keys: string[],
) => {
	const payload = (project?.payloadJson ?? {}) as Record<string, any>;
	const form = (payload.form ?? payload) as Record<string, any>;

	for (const key of keys) {
		const value = form[key] ?? payload[key] ?? (project as any)?.[key];
		if (value !== undefined && value !== null && value !== '') {
			return value;
		}
	}

	return null;
};

const formatValue = (value: unknown) => {
	if (value === undefined || value === null || value === '') return '—';
	return String(value);
};

const formatDateTime = (value?: string | null) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
};

const getPrepareEligibility = (status?: ProjectStatus | null) => {
	switch (status) {
		case 'approved':
			return { eligible: true, reason: '' };
		case 'draft':
			return {
				eligible: false,
				reason: 'Approve the project before starting issuance preparation.',
			};
		case 'under_review':
			return {
				eligible: false,
				reason:
					'This project is still under review and cannot enter issuance prep yet.',
			};
		case 'changes_requested':
			return {
				eligible: false,
				reason: 'Resolve the requested changes before preparing issuance.',
			};
		case 'issued':
		case 'live':
			return {
				eligible: false,
				reason: 'This project has already moved beyond issuance preparation.',
			};
		case 'locked':
			return {
				eligible: false,
				reason: 'Locked projects cannot enter issuance preparation.',
			};
		default:
			return {
				eligible: false,
				reason: 'This project is not eligible for issuance preparation yet.',
			};
	}
};

const deriveIssuancePrepStatus = (
	summary?: EntitySpvSummary | null,
): {
	label: string;
	tone: 'yellow' | 'pink' | 'blue' | 'gray';
	description: string;
} => {
	const linkedSpv = summary?.linkedSpv;
	const readiness = summary?.readiness ?? linkedSpv?.readiness;

	if (!linkedSpv) {
		return {
			label: 'SPV not prepared',
			tone: 'gray',
			description:
				'No issuance SPV has been prepared for this project yet. Start issuance prep to create a draft SPV and generate linked party suggestions.',
		};
	}

	if (readiness?.issuanceReady) {
		return {
			label: 'Ready for issuance',
			tone: 'blue',
			description:
				'Required linked parties are approved and custody blockers are cleared.',
		};
	}

	if (!readiness?.custodyComplete) {
		return {
			label: 'Issuance blocked',
			tone: 'pink',
			description:
				'Custody setup is still incomplete, so issuance readiness remains blocked.',
		};
	}

	if (!readiness?.requiredRolesComplete) {
		return {
			label: 'Linked parties pending review',
			tone: 'yellow',
			description:
				'RegenX has created or refreshed a draft SPV, but required linked parties still need approval or replacement.',
		};
	}

	return {
		label: 'Draft SPV created',
		tone: 'yellow',
		description:
			'A draft SPV exists for this project. Review linked parties and readiness before issuance.',
	};
};

export default function AdminProjectApprovalDetail() {
	const navigate = useNavigate();
	const { id } = useParams();
	const projectId = id ? String(id) : '';

	const [project, setProject] = useState<IProject | null>(null);
	const [summary, setSummary] = useState<EntitySpvSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isWorking, setIsWorking] = useState(false);
	const [isPreparing, setIsPreparing] = useState(false);
	const [adminNotes, setAdminNotes] = useState('');
	const [error, setError] = useState('');
	const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
	const [isRpaModalOpen, setIsRpaModalOpen] = useState(false);
	const [rpaSummary, setRpaSummary] = useState<RpaSummary | null>(null);
	const [isRpaLoading, setIsRpaLoading] = useState(false);
	const [rpaError, setRpaError] = useState('');

	const service = projectService as any;

	const callServiceMethod = async (methodNames: string[], ...args: any[]) => {
		for (const methodName of methodNames) {
			if (typeof service?.[methodName] === 'function') {
				return await service[methodName](...args);
			}
		}
		throw new Error(
			`No matching projectService method found. Tried: ${methodNames.join(
				', ',
			)}`,
		);
	};

	const loadProject = async () => {
		if (!projectId) {
			setIsLoading(false);
			setError('No project id provided.');
			return;
		}

		try {
			setIsLoading(true);
			setIsRpaLoading(true);
			setError('');
			setRpaError('');
			const [projectRecord, summaryRecord] = await Promise.all([
				projectService.getProject(projectId),
				entitySpvAdminService.getProjectEntitySpvSummary(projectId),
			]);
			setProject((projectRecord?.data ?? projectRecord) as IProject);
			setSummary(summaryRecord ?? null);

			try {
				const rpaRecord = await projectService.getRpaSummary(projectId);
				setRpaSummary((rpaRecord?.data ?? rpaRecord) as RpaSummary);
			} catch (rpaLoadError: any) {
				console.error('Failed to load generated RPA preview', rpaLoadError);
				setRpaError(
					rpaLoadError?.response?.data?.message ||
						rpaLoadError?.message ||
						'Unable to load the generated RPA preview.',
				);
			}
		} catch (loadError: any) {
			console.error('Failed to load admin project detail', loadError);
			setError(
				loadError?.response?.data?.message ||
					loadError?.message ||
					'Failed to load the project approval detail.',
			);
		} finally {
			setIsLoading(false);
			setIsRpaLoading(false);
		}
	};

	const handleApprove = () => {
		if (!projectId) return;
		setError('');
		setIsApprovalModalOpen(true);
	};

	const handleApproveOnly = async () => {
		if (!projectId) return;
		try {
			setIsWorking(true);
			setError('');
			await callServiceMethod(
				['approveProject', 'approve'],
				projectId,
				adminNotes.trim() || undefined,
			);
			setIsApprovalModalOpen(false);
			await loadProject();
			notificationService.success(
				'Project approved. Token issuance not yet executed.',
			);
		} catch (error: any) {
			console.error('Approve failed', error);
			setError(error?.response?.data?.message || 'Approve failed.');
			notificationService.error(
				error?.response?.data?.message || 'Approve failed.',
			);
		} finally {
			setIsWorking(false);
		}
	};

	const handleApproveAndIssue = async () => {
		if (!projectId) return;
		try {
			setIsWorking(true);
			setError('');
			await callServiceMethod(
				['approveProject', 'approve'],
				projectId,
				adminNotes.trim() || undefined,
			);
			await callServiceMethod(
				['issueProject', 'issue'],
				projectId,
				adminNotes.trim() || undefined,
			);
			setIsApprovalModalOpen(false);
			await loadProject();
			notificationService.success('Project approved and tokens issued.');
		} catch (error: any) {
			console.error('Approve and issue failed', error);
			const message =
				error?.response?.data?.message ||
				error?.response?.data?.title ||
				error?.message ||
				'Approve and issue failed.';
			setError(message);
			notificationService.error(message);
		} finally {
			setIsWorking(false);
		}
	};

	const handleRequestChanges = async () => {
		if (!projectId) return;
		if (!adminNotes.trim()) {
			setError('Please enter feedback before requesting changes.');
			return;
		}

		try {
			setIsWorking(true);
			setError('');
			await callServiceMethod(
				['requestRevision', 'requestChanges'],
				projectId,
				adminNotes.trim(),
			);
			navigate(-1);
		} catch (error: any) {
			console.error('Request changes failed', error);
			alert(error?.response?.data?.message || 'Request changes failed.');
		} finally {
			setIsWorking(false);
		}
	};

	const handleReject = async () => {
		if (!projectId) return;
		if (!adminNotes.trim()) {
			setError('Please enter a rejection reason.');
			return;
		}

		try {
			setIsWorking(true);
			setError('');
			await callServiceMethod(
				['rejectProject', 'reject'],
				projectId,
				adminNotes.trim(),
			);
			navigate(-1);
		} catch (error: any) {
			console.error('Reject failed', error);
			alert(error?.response?.data?.message || 'Reject failed.');
		} finally {
			setIsWorking(false);
		}
	};

	useEffect(() => {
		void loadProject();
	}, [projectId]);

	const handlePrepareForIssuance = async () => {
		if (!projectId) return;

		try {
			setIsPreparing(true);
			setError('');
			const hadLinkedSpv = Boolean(summary?.linkedSpv?.id);
			const prepared = await projectService.prepareProjectForIssuance(
				projectId,
				adminNotes.trim() || undefined,
			);
			const preparedSpvId = Number(prepared?.id ?? prepared?.data?.id);

			if (Number.isNaN(preparedSpvId) || preparedSpvId <= 0) {
				throw new Error('Draft SPV was prepared, but no SPV id was returned.');
			}

			navigate(`/admin/entities-spvs/spvs/${preparedSpvId}`, {
				state: {
					flashSuccess: hadLinkedSpv
						? 'Draft SPV reused and linked party suggestions refreshed. Review required roles before issuance.'
						: 'Draft SPV created and linked party suggestions generated. Review required roles before issuance.',
				},
			});
		} catch (prepareError: any) {
			console.error('Prepare for issuance failed', prepareError);
			setError(
				prepareError?.response?.data?.message ||
					prepareError?.message ||
					'Failed to prepare issuance for this project.',
			);
		} finally {
			setIsPreparing(false);
		}
	};

	const projectStatus = String(project?.status ?? 'draft') as ProjectStatus;
	const eligibility = getPrepareEligibility(projectStatus);
	const issuancePrepStatus = deriveIssuancePrepStatus(summary);
	const linkedSpv = summary?.linkedSpv ?? null;
	const readiness = summary?.readiness ?? linkedSpv?.readiness ?? null;
	const issuerParty = linkedSpv?.linkedParties?.find(
		(party) => party.role === 'issuer',
	);
	const custodyProviderParty = linkedSpv?.linkedParties?.find(
		(party) => party.role === 'custody_provider',
	);
	const proceedsParty = linkedSpv?.linkedParties?.find(
		(party) => party.role === 'proceeds_recipient',
	);
	const tokenSymbol = formatValue(
		getProjectField(project, ['tokenSymbol', 'assetCode']),
	);
	const tokenSupply = formatValue(
		getProjectField(project, [
			'tokenSupply',
			'issuedSupply',
			'totalTokenSupply',
		]),
	);
	const alreadyIssued = Boolean(
		project?.issuanceStatus === 'completed' ||
			project?.issuanceTxHash ||
			project?.issuedAt ||
			projectStatus === 'issued' ||
			projectStatus === 'live',
	);
	const modalBlockers: string[] = [
		...(readiness?.blockingIssues ?? []),
		!linkedSpv ? 'Linked SPV has not been prepared.' : '',
		readiness && !readiness.issuanceReady
			? 'Issuance readiness is not complete.'
			: '',
	].filter((blocker): blocker is string => Boolean(blocker));
	const canIssueFromModal =
		!alreadyIssued &&
		modalBlockers.length === 0 &&
		Boolean(readiness?.issuanceReady);

	const content = useMemo(() => {
		if (!projectId) {
			return (
				<div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-rose-600">No project id provided.</p>
				</div>
			);
		}

		return <ProjectSetup forcedProjectId={projectId} forceReadOnly embedded />;
	}, [projectId]);

	return (
		<div className="bg-[#F7F8FB]" data-test="admin-project-approval-detail">
			<div className="max-w-[1220px] px-4 py-4">
				<div className="border-b border-[#E7ECF4] pb-4">
					<div className="inline-flex items-center rounded-[8px] bg-[#DDEBFF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
						ADMIN PORTAL
					</div>
					<h1 className="mt-2 text-[30px] font-semibold leading-tight text-[#16588F]">
						{formatProjectName(project)}
					</h1>
					<p className="mt-1 max-w-[760px] text-[14px] leading-[1.5] text-[#5F6C86]">
						Review the project, prepare issuance when eligible, and route
						directly into SPV linked-party review.
					</p>
				</div>

				<div className="mt-6">
					{error ? (
						<div
							className="mb-4 rounded-[18px] border border-[#F2C6C6] bg-[#FFF7F7] px-5 py-4 text-sm text-[#B42318]"
							data-test="project-issuance-error"
						>
							{error}
						</div>
					) : null}

					<AdminSectionCard
						title="Project issuance preparation"
						description={issuancePrepStatus.description}
						className="overflow-hidden"
					>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:gap-3">
							<AdminDataField
								label="Project Status"
								value={
									<AdminStatusBadge
										label={projectStatus}
										tone={getTone(projectStatus)}
									/>
								}
							/>
							<AdminDataField
								label="Issuance Prep"
								value={
									<span data-test="project-issuance-prep-state">
										<AdminStatusBadge
											label={issuancePrepStatus.label}
											tone={issuancePrepStatus.tone}
										/>
									</span>
								}
							/>
							<AdminDataField
								label="Linked SPV"
								value={
									linkedSpv
										? `${linkedSpv.name} (#${linkedSpv.id})`
										: 'Not prepared'
								}
							/>
							<AdminDataField
								label="Structure"
								value={linkedSpv?.structureType || formatProjectType(project)}
							/>
							<AdminDataField
								label="Project Stage"
								value={formatProjectStage(project)}
							/>
							<AdminDataField
								label="Jurisdiction"
								value={linkedSpv?.jurisdiction || formatJurisdiction(project)}
							/>
							<AdminDataField
								label="Required Roles Complete"
								value={
									<AdminStatusBadge
										label={readiness?.requiredRolesComplete ? 'Yes' : 'No'}
										tone={readiness?.requiredRolesComplete ? 'blue' : 'yellow'}
									/>
								}
							/>
							<AdminDataField
								label="Custody Complete"
								value={
									<AdminStatusBadge
										label={readiness?.custodyComplete ? 'Yes' : 'No'}
										tone={readiness?.custodyComplete ? 'blue' : 'yellow'}
									/>
								}
							/>
							<AdminDataField
								label="Issuance Ready"
								value={
									<AdminStatusBadge
										label={readiness?.issuanceReady ? 'Yes' : 'No'}
										tone={readiness?.issuanceReady ? 'blue' : 'pink'}
									/>
								}
							/>
							<AdminDataField
								label="Sponsor Entity"
								value={summary?.sponsorEntity?.entityName || 'Not linked'}
							/>
						</div>

						<div
							className="mt-3 rounded-[18px] border border-[#E7ECF4] bg-[#F8FAFC] p-4"
							data-test="project-issuance-blockers"
						>
							<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
								Issuance blockers
							</div>
							{readiness?.blockingIssues?.length ? (
								<ul className="mt-2 space-y-1 text-sm text-[#B42318]">
									{readiness.blockingIssues.map((issue) => (
										<li key={issue}>{issue}</li>
									))}
								</ul>
							) : (
								<p className="mt-2 text-sm text-[#B42318]">
									No active blockers reported.
								</p>
							)}
						</div>

						<div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
							<div className="rounded-[18px] border border-[#E7ECF4] bg-[#F8FAFC] p-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)] xl:col-span-4">
								<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
									Issuance actions
								</div>
								<h3 className="mt-2 text-[20px] font-semibold text-[#163F74]">
									Advance issuance workflow
								</h3>
								<p className="mt-2 text-sm leading-[1.7] text-[#5F6C86]">
									Prepare the draft SPV, then move directly into linked-party
									review and readiness checks.
								</p>

								<div
									className="mt-3 space-y-3"
									data-test="project-issuance-prep-panel"
								>
									<AdminActionButton
										tone="primary"
										className="w-full"
										disabled={!eligibility.eligible || isPreparing || isLoading}
										onClick={handlePrepareForIssuance}
										data-test="project-prepare-issuance"
									>
										{isPreparing
											? 'Preparing issuance...'
											: 'Prepare for issuance'}
									</AdminActionButton>

									<AdminActionButton
										className="w-full"
										disabled={!linkedSpv?.id}
										onClick={() =>
											linkedSpv?.id
												? navigate(`/admin/entities-spvs/spvs/${linkedSpv.id}`)
												: undefined
										}
										data-test="project-open-spv-review"
									>
										Open linked-party review
									</AdminActionButton>

									{!eligibility.eligible ? (
										<p
											className="rounded-[14px] border border-[#F2D39B] bg-[#FFF9EC] px-4 py-3 text-sm text-[#8A5A00]"
											data-test="project-prepare-issuance-reason"
										>
											{eligibility.reason}
										</p>
									) : (
										<p className="text-sm leading-[1.7] text-[#5F6C86]">
											Prepare issuance will create or reuse the project draft
											SPV, refresh linked-party suggestions, and route directly
											into SPV review.
										</p>
									)}
								</div>
							</div>

							<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)] xl:col-span-8">
								<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
									Admin feedback
								</div>
								<h3 className="mt-2 text-[20px] font-semibold text-[#163F74]">
									Review decision and notes
								</h3>
								<p className="mt-2 max-w-[720px] text-sm leading-[1.7] text-[#5F6C86]">
									Provide clear review notes for the developer before approving,
									requesting changes, or rejecting.
								</p>

								<div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
									<div>
										<p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
											Review notes
										</p>
										<textarea
											value={adminNotes}
											onChange={(e) => setAdminNotes(e.target.value)}
											rows={7}
											className="min-h-[220px] w-full rounded-[18px] border border-[#D0D5DD] bg-white px-4 py-3 text-sm leading-[1.6] text-[#101828] outline-none focus:border-[#2F80ED]"
											placeholder="Enter feedback, rationale, or issuance context for the admin record."
										/>
									</div>

									<div className="flex flex-col justify-end">
										<div className="space-y-3">
											<AdminActionButton
												tone="primary"
												className="w-full"
												disabled={isWorking}
												onClick={handleApprove}
											>
												{isWorking ? 'Working...' : 'Approve Project'}
											</AdminActionButton>

											<AdminActionButton
												className="w-full"
												disabled={isWorking}
												onClick={handleRequestChanges}
											>
												Request Changes
											</AdminActionButton>

											<AdminActionButton
												tone="danger"
												className="w-full"
												disabled={isWorking}
												onClick={handleReject}
											>
												Reject Project
											</AdminActionButton>

											<button
												type="button"
												className="w-full text-sm text-[#5F6C86]"
												onClick={() => navigate(-1)}
											>
												Back to approvals
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</AdminSectionCard>

					<AdminSectionCard
						title="Generated RPA Preview"
						description="Read-only Revenue Participation Agreement Summary generated from project inputs."
						className="mt-6"
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<AdminStatusBadge label="Read only" tone="blue" />
								<p className="mt-2 text-sm leading-[1.7] text-[#5F6C86]">
									Admins, developers, and investors see the same
									backend-generated summary.
								</p>
							</div>
							<AdminActionButton
								disabled={isRpaLoading || !rpaSummary}
								onClick={() => setIsRpaModalOpen(true)}
							>
								Open read-only preview
							</AdminActionButton>
						</div>
						<div className="mt-5 max-h-[520px] overflow-y-auto rounded-[18px] border border-[#E7ECF4] bg-[#F8FAFC] p-4">
							<RevenueParticipationAgreementContent
								summary={rpaSummary}
								isLoading={isRpaLoading}
								error={rpaError}
							/>
						</div>
					</AdminSectionCard>

					<div className="mt-8">{content}</div>
				</div>
			</div>

			<RevenueParticipationAgreementModal
				isOpen={isRpaModalOpen}
				onClose={() => setIsRpaModalOpen(false)}
				summary={rpaSummary}
				isLoading={isRpaLoading}
				error={rpaError}
			/>

			{isApprovalModalOpen ? (
				<div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4 py-6">
					<div className="max-h-[90vh] w-full max-w-[820px] overflow-y-auto rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-lg">
						<div className="flex flex-col gap-3 border-b border-[#E7ECF4] pb-4 md:flex-row md:items-start md:justify-between">
							<div>
								<div className="inline-flex rounded-[8px] bg-[#DDEBFF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
									Admin confirmation
								</div>
								<h2 className="mt-3 text-[26px] font-semibold text-[#163F74]">
									Approve Project & Prepare Token Issuance
								</h2>
								<p className="mt-2 text-sm leading-[1.6] text-[#5F6C86]">
									Choose whether to approve this project only, or approve it and
									execute token issuance now.
								</p>
							</div>
							<AdminStatusBadge
								label={
									alreadyIssued ? 'Tokens issued' : issuancePrepStatus.label
								}
								tone={alreadyIssued ? 'blue' : issuancePrepStatus.tone}
							/>
						</div>

						<div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
							<AdminDataField
								label="Project Name"
								value={formatProjectName(project)}
							/>
							<AdminDataField label="Token Symbol" value={tokenSymbol} />
							<AdminDataField label="Token Supply" value={tokenSupply} />
							<AdminDataField
								label="Linked SPV"
								value={
									linkedSpv
										? `${linkedSpv.name} (#${linkedSpv.id})`
										: 'Not prepared'
								}
							/>
							<AdminDataField
								label="Structure Type"
								value={linkedSpv?.structureType || formatProjectType(project)}
							/>
							<AdminDataField
								label="Issuer Account / Entity"
								value={
									project?.issuerWalletPublic ||
									summary?.walletAlignment?.issuerWalletAddress ||
									issuerParty?.entityName ||
									'Not linked'
								}
							/>
							<AdminDataField
								label="Distribution / Treasury Custody Account"
								value={
									project?.distributorWalletPublic ||
									summary?.walletAlignment?.distributionWalletAddress ||
									project?.proceedsWalletAddress ||
									proceedsParty?.entityName ||
									'Not configured'
								}
							/>
							<AdminDataField
								label="Custody Provider Status"
								value={
									custodyProviderParty ? (
										<div className="space-y-2">
											<AdminStatusBadge
												label={custodyProviderParty.status}
												tone={getTone(custodyProviderParty.status)}
											/>
											<div className="text-[13px] font-medium text-[#5F6C86]">
												{custodyProviderParty.entityName || 'Entity not linked'}
											</div>
										</div>
									) : (
										<AdminStatusBadge
											label={
												readiness?.custodyComplete ? 'Complete' : 'Missing'
											}
											tone={readiness?.custodyComplete ? 'blue' : 'yellow'}
										/>
									)
								}
							/>
							<AdminDataField
								label="Issuance Readiness Status"
								value={
									<AdminStatusBadge
										label={readiness?.issuanceReady ? 'Ready' : 'Blocked'}
										tone={readiness?.issuanceReady ? 'blue' : 'pink'}
									/>
								}
							/>
							<AdminDataField
								label="Issuance Status"
								value={
									<AdminStatusBadge
										label={project?.issuanceStatus || 'not_started'}
										tone={
											alreadyIssued ? 'blue' : getTone(project?.issuanceStatus)
										}
									/>
								}
							/>
						</div>

						{alreadyIssued ? (
							<div className="mt-3 rounded-[18px] border border-[#B7E4C7] bg-[#F4FFF7] p-4 text-sm text-[#236A43]">
								<div className="font-semibold">Tokens already issued.</div>
								<div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
									<div>Tx hash: {formatValue(project?.issuanceTxHash)}</div>
									<div>Issued at: {formatDateTime(project?.issuedAt)}</div>
								</div>
							</div>
						) : null}

						<div className="mt-3 rounded-[18px] border border-[#E7ECF4] bg-[#F8FAFC] p-4">
							<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A96AA]">
								Any blockers
							</div>
							{modalBlockers.length ? (
								<div className="mt-3 space-y-2">
									{modalBlockers.map((blocker) => (
										<div
											key={blocker}
											className="rounded-[14px] border border-[#F2D39B] bg-[#FFF9EC] px-4 py-3 text-sm text-[#8A5A00]"
										>
											{blocker}
										</div>
									))}
								</div>
							) : (
								<p className="mt-2 text-sm text-[#B42318]">
									No active issuance blockers reported.
								</p>
							)}
						</div>

						<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<AdminActionButton
								className="sm:w-auto"
								disabled={isWorking}
								onClick={() => setIsApprovalModalOpen(false)}
							>
								Cancel
							</AdminActionButton>
							<AdminActionButton
								className="sm:w-auto"
								disabled={isWorking || alreadyIssued}
								onClick={handleApproveOnly}
							>
								{isWorking ? 'Working...' : 'Approve Only'}
							</AdminActionButton>
							<AdminActionButton
								tone="primary"
								className="sm:w-auto"
								disabled={isWorking || !canIssueFromModal}
								onClick={handleApproveAndIssue}
							>
								{isWorking ? 'Working...' : 'Approve & Issue Tokens'}
							</AdminActionButton>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
