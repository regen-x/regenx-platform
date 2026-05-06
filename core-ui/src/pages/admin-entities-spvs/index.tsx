import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	AdminActionButton,
	AdminEmptyState,
	AdminPageHeader,
	AdminSectionCard,
	AdminStatCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import {
	IssuancePipelineRow,
	IssuancePipelineSummary,
	LegalEntityRecord,
	entitySpvAdminService,
} from '@/services/entity-spv-admin.service';

const getStatusTone = (
	status?: string | null,
): 'yellow' | 'pink' | 'blue' | 'gray' => {
	switch (status) {
		case 'ready':
		case 'approved':
		case 'active':
			return 'blue';
		case 'blocked':
		case 'rejected':
		case 'archived':
			return 'pink';
		case 'not_prepared':
		case 'in_progress':
		case 'missing':
		case 'draft':
		case 'inactive':
			return 'yellow';
		default:
			return 'gray';
	}
};

const formatPipelineState = (state?: string | null) => {
	switch (state) {
		case 'not_prepared':
			return 'Not Prepared';
		case 'in_progress':
			return 'In Structuring';
		case 'blocked':
			return 'Blocked';
		case 'ready':
			return 'Ready';
		default:
			return 'Unknown';
	}
};

const formatProjectStatus = (value?: string | null) =>
	String(value ?? '')
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ') || 'No status';

export default function AdminEntitiesSpvs() {
	const navigate = useNavigate();
	const [pipelineRows, setPipelineRows] = useState<IssuancePipelineRow[]>([]);
	const [summary, setSummary] = useState<IssuancePipelineSummary>({
		total: 0,
		notPrepared: 0,
		inProgress: 0,
		blocked: 0,
		ready: 0,
	});
	const [entities, setEntities] = useState<LegalEntityRecord[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [preparingProjectId, setPreparingProjectId] = useState<number | null>(
		null,
	);
	const [error, setError] = useState('');

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError('');

			const [pipelineResult, summaryResult, entitiesResult] =
				await Promise.allSettled([
					entitySpvAdminService.listIssuancePipeline(),
					entitySpvAdminService.getIssuancePipelineSummary(),
					entitySpvAdminService.listEntities(),
				]);

			const nextPipelineRows =
				pipelineResult.status === 'fulfilled' ? pipelineResult.value ?? [] : [];
			const nextSummary =
				summaryResult.status === 'fulfilled'
					? summaryResult.value ?? {
							total: 0,
							notPrepared: 0,
							inProgress: 0,
							blocked: 0,
							ready: 0,
					  }
					: {
							total: nextPipelineRows.length,
							notPrepared: nextPipelineRows.filter(
								(row) => row.readinessState === 'not_prepared',
							).length,
							inProgress: nextPipelineRows.filter(
								(row) => row.readinessState === 'in_progress',
							).length,
							blocked: nextPipelineRows.filter(
								(row) => row.readinessState === 'blocked',
							).length,
							ready: nextPipelineRows.filter(
								(row) => row.readinessState === 'ready',
							).length,
					  };
			const nextEntities =
				entitiesResult.status === 'fulfilled' ? entitiesResult.value ?? [] : [];

			setPipelineRows(nextPipelineRows);
			setSummary(nextSummary);
			setEntities(nextEntities);

			const failedSections: string[] = [];
			if (pipelineResult.status === 'rejected') {
				console.error(
					'Failed to load issuance pipeline list',
					pipelineResult.reason,
				);
				failedSections.push('issuance pipeline');
			}
			if (summaryResult.status === 'rejected') {
				console.error(
					'Failed to load issuance pipeline summary',
					summaryResult.reason,
				);
				failedSections.push('pipeline summary');
			}
			if (entitiesResult.status === 'rejected') {
				console.error(
					'Failed to load supporting entity registry',
					entitiesResult.reason,
				);
				failedSections.push('supporting entity registry');
			}

			if (failedSections.length > 0) {
				setError(`Failed to load ${failedSections.join(', ')}.`);
			}

			setLoading(false);
		};

		void load();
	}, []);

	const query = search.trim().toLowerCase();
	const filteredPipeline = useMemo(
		() =>
			pipelineRows.filter((row) => {
				if (!query) return true;
				return [
					row.projectName,
					row.projectStatus,
					row.projectStage,
					row.spvName,
					row.spvStatus,
					row.structureType,
					row.sponsorEntityName,
					row.jurisdiction,
					formatPipelineState(row.readinessState),
					...row.blockers,
				]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(query));
			}),
		[pipelineRows, query],
	);

	const filteredEntities = useMemo(
		() =>
			entities.filter((entity) => {
				if (!query) return true;
				return [
					entity.entityName,
					entity.tradingName,
					entity.entityType,
					entity.operationalRole,
					entity.jurisdiction,
				]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(query));
			}),
		[entities, query],
	);

	const handlePipelineAction = async (row: IssuancePipelineRow) => {
		if (row.spvId) {
			navigate(`/admin/entities-spvs/spvs/${row.spvId}`);
			return;
		}

		try {
			setPreparingProjectId(row.projectId);
			const spv = await entitySpvAdminService.prepareProjectForIssuance(
				row.projectId,
				'Create draft SPV from issuance pipeline',
			);
			navigate(`/admin/entities-spvs/spvs/${spv.id}`);
		} catch (prepareError) {
			console.error('Failed to prepare project for issuance', prepareError);
			setError(
				'Failed to prepare a draft SPV for this project. Please try again.',
			);
		} finally {
			setPreparingProjectId(null);
		}
	};

	return (
		<div
			className="min-h-screen bg-[#F7F8FB] px-4 py-4"
			data-cy="admin-entities-spvs-page"
		>
			<div className="max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Issuance Pipeline"
					description="Review approved projects, draft SPVs, linked-party coverage, custody completeness, and issuance readiness in one place."
				/>

				<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					<AdminStatCard
						label="Not Prepared"
						value={summary.notPrepared}
						helper="Approved projects that still need a draft SPV."
						tone="yellow"
					/>
					<AdminStatCard
						label="In Structuring"
						value={summary.inProgress}
						helper="Projects with draft structure work still underway."
						tone="neutral"
					/>
					<AdminStatCard
						label="Blocked"
						value={summary.blocked}
						helper="Projects waiting on blockers before issuance prep can continue."
						tone="pink"
					/>
					<AdminStatCard
						label="Ready"
						value={summary.ready}
						helper="Projects with structure, custody, and linked parties in place."
						tone="blue"
					/>
				</div>

				<AdminSectionCard className="mb-6">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#101828] outline-none placeholder:text-[#98A2B3]"
							placeholder="Search projects, draft SPVs, structure, readiness, blockers, or supporting entities"
							data-cy="entities-spvs-search"
						/>
						<div className="flex flex-wrap gap-3">
							<AdminActionButton
								tone="secondary"
								onClick={() => navigate('/admin/entities-spvs/entities/new')}
							>
								Manual Entity
							</AdminActionButton>
							<AdminActionButton
								tone="secondary"
								onClick={() => navigate('/admin/entities-spvs/spvs/new')}
							>
								Manual SPV
							</AdminActionButton>
						</div>
					</div>
					<div className="mt-4 rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#16588F]">
							Fallback Tools
						</div>
						<p className="mt-2 text-[13px] leading-[1.6] text-[#5F6C86]">
							Manual entity and SPV creation stays available for exceptional
							cases, but the primary workflow is now project-driven issuance
							preparation.
						</p>
					</div>
					{error ? (
						<div className="mt-4 rounded-[16px] border border-[#F3D2D2] bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#B42318]">
							{error}
						</div>
					) : null}
				</AdminSectionCard>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
					<AdminSectionCard className="space-y-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#16588F]">
									Project-Driven Structuring
								</div>
								<p className="mt-2 text-[13px] leading-[1.6] text-[#5F6C86]">
									Track approved projects, linked draft SPVs, supporting party
									coverage, and issuance blockers from a single workflow view.
								</p>
							</div>
							<AdminStatusBadge
								label={`${filteredPipeline.length} Projects`}
								tone="blue"
							/>
						</div>

						{!loading && filteredPipeline.length === 0 ? (
							<AdminEmptyState
								title="No approved projects are currently in issuance preparation."
								description="Once projects are approved or otherwise become issuance-prep eligible, they will appear here with draft SPV status, readiness signals, and next actions."
							/>
						) : (
							<div className="overflow-x-auto">
								<table
									className="w-full text-sm"
									data-cy="issuance-pipeline-table"
								>
									<thead>
										<tr className="border-b border-[#EEF2F7] text-left text-[#98A2B3]">
											<th className="pb-4 pr-4 font-medium uppercase tracking-[0.08em]">
												Project
											</th>
											<th className="px-3 pb-4 font-medium uppercase tracking-[0.08em]">
												SPV
											</th>
											<th className="px-3 pb-4 font-medium uppercase tracking-[0.08em]">
												Structure
											</th>
											<th className="px-3 pb-4 font-medium uppercase tracking-[0.08em]">
												Linked Parties
											</th>
											<th className="px-3 pb-4 font-medium uppercase tracking-[0.08em]">
												Custody
											</th>
											<th className="px-3 pb-4 font-medium uppercase tracking-[0.08em]">
												Readiness
											</th>
											<th className="pl-3 pb-4 text-right font-medium uppercase tracking-[0.08em]">
												Action
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredPipeline.map((row) => {
											const actionLabel = row.spvId
												? row.readinessState === 'ready'
													? 'Open SPV Workspace'
													: 'Review Structure'
												: 'Prepare for Issuance';

											return (
												<tr
													key={row.projectId}
													className="border-b border-[#F2F4F7] last:border-b-0"
													data-cy={`pipeline-row-${row.projectId}`}
												>
													<td className="py-4 pr-4 align-top">
														<div className="font-semibold text-[#163F74]">
															{row.projectName || `Project ${row.projectId}`}
														</div>
														<div className="mt-1 text-[12px] text-[#5F6C86]">
															{formatProjectStatus(row.projectStatus)}
															{row.projectStage
																? ` • ${formatProjectStatus(row.projectStage)}`
																: ''}
														</div>
														<div className="mt-1 text-[12px] text-[#5F6C86]">
															{row.jurisdiction || 'Jurisdiction not set'}
														</div>
													</td>
													<td className="px-3 py-4 align-top text-[#475467]">
														<div className="font-medium text-[#163F74]">
															{row.spvName || 'Draft Not Prepared'}
														</div>
														<div className="mt-1 text-[12px] text-[#5F6C86]">
															{row.spvStatus
																? formatProjectStatus(row.spvStatus)
																: 'No draft SPV yet'}
														</div>
													</td>
													<td className="px-3 py-4 align-top text-[#475467]">
														<div>
															{row.structureType || 'Structure pending'}
														</div>
														<div className="mt-1 text-[12px] text-[#5F6C86]">
															{row.sponsorEntityName ||
																'Sponsor entity pending'}
														</div>
													</td>
													<td className="px-3 py-4 align-top text-[#475467]">
														<div>
															{row.linkedPartyProgress.linkedRequiredRoles}/
															{row.linkedPartyProgress.totalRequiredRoles}{' '}
															complete
														</div>
														<div className="mt-1 text-[12px] text-[#5F6C86]">
															{row.blockerCount} blocker
															{row.blockerCount === 1 ? '' : 's'}
														</div>
													</td>
													<td className="px-3 py-4 align-top">
														<AdminStatusBadge
															label={
																row.custodyComplete ? 'Complete' : 'Incomplete'
															}
															tone={row.custodyComplete ? 'blue' : 'yellow'}
														/>
													</td>
													<td className="px-3 py-4 align-top">
														<AdminStatusBadge
															label={formatPipelineState(row.readinessState)}
															tone={getStatusTone(row.readinessState)}
														/>
														<div className="mt-2 text-[12px] text-[#5F6C86]">
															{row.blockers[0] ||
																'All issuance preparation checks passed.'}
														</div>
													</td>
													<td className="py-4 pl-3 text-right align-top">
														<AdminActionButton
															tone={row.spvId ? 'secondary' : 'primary'}
															onClick={() => void handlePipelineAction(row)}
															disabled={preparingProjectId === row.projectId}
															className="min-h-[42px] px-4"
														>
															{preparingProjectId === row.projectId
																? 'Preparing...'
																: actionLabel}
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

					<div className="space-y-6">
						<AdminSectionCard className="space-y-4">
							<div className="flex items-start justify-between gap-3">
								<div>
									<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#16588F]">
										Supporting Entity Registry
									</div>
									<p className="mt-2 text-[13px] leading-[1.6] text-[#5F6C86]">
										Supporting legal entities available for sponsor, trustee,
										issuer, custody, and proceeds roles.
									</p>
								</div>
								<AdminStatusBadge
									label={`${filteredEntities.length} Entities`}
									tone="blue"
								/>
							</div>

							{!loading && filteredEntities.length === 0 ? (
								<AdminEmptyState
									title="No legal entities are available yet"
									description="Supporting entities will appear here for linked-party review and exception handling."
								/>
							) : (
								<div className="space-y-3">
									{filteredEntities.slice(0, 6).map((entity) => (
										<div
											key={entity.id}
											className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]"
										>
											<div className="flex items-start justify-between gap-3">
												<div>
													<div className="font-semibold text-[#163F74]">
														{entity.entityName}
													</div>
													<div className="mt-1 text-[13px] text-[#5F6C86]">
														{entity.operationalRole ||
															entity.entityType ||
															entity.jurisdiction ||
															'No extra details'}
													</div>
												</div>
												<AdminStatusBadge
													label={entity.status}
													tone={getStatusTone(entity.status)}
												/>
											</div>
											<div className="mt-3">
												<button
													type="button"
													className="text-[13px] font-semibold text-[#346FB6]"
													onClick={() =>
														navigate(
															`/admin/entities-spvs/entities/${entity.id}`,
														)
													}
												>
													Open entity
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</AdminSectionCard>
					</div>
				</div>
			</div>
		</div>
	);
}
