import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/PageHeader';
import { IProject } from '@/interfaces/api/IProject';
import { projectService } from '@/services/project.service';

type ProjectStatus =
	| 'draft'
	| 'under_review'
	| 'changes_requested'
	| 'approved'
	| 'issued'
	| 'live'
	| 'locked';

type ProjectCardRecord = {
	id: string;
	projectName: string;
	dseType: string;
	projectType: string;
	stage: string;
	fundingGoal: string;
	location: string;
	thumbnailImageUrl: string;
	progressPercent: number;
	status: ProjectStatus;
	submittedAt: string;
	adminNotes?: string;
	minimumInvestment?: string;
	targetAnnualYield?: string;
	cashflowLabel?: string;
	structureLabel?: string;
	settlementLabel?: string;
	fundedSoFar?: string;
};

const formatCurrency = (value?: string) => {
	const num = Number(value || 0);
	return `$${num.toLocaleString()}`;
};

const mapProject = (project: IProject): ProjectCardRecord => {
	return {
		id: project.id ?? '',
		projectName: project.name ?? 'Untitled Project',
		dseType: project.dseType ?? 'Operating DSE',
		projectType: project.projectType ?? 'Solar',
		stage: project.stage ?? 'Development',
		fundingGoal: String(project.fundingGoal ?? '0'),
		location: project.location ?? 'Not set',
		thumbnailImageUrl: project.thumbnailUrl ?? '',
		progressPercent: Number(project.percentFunded ?? 0),
		status: (project.status as ProjectStatus) ?? 'draft',
		submittedAt: project.submittedAt ?? project.updatedAt ?? project.createdAt,
		adminNotes: project.adminNotes ?? undefined,
		minimumInvestment: project.minimumInvestment ?? '',
		targetAnnualYield: project.targetAnnualYield ?? '',
		cashflowLabel: 'Operating cashflows',
		structureLabel: 'SPV / trust linked',
		settlementLabel: 'AUDD',
		fundedSoFar: String(project.fundedSoFar ?? 0),
	};
};

const getFundingProgressText = (project: ProjectCardRecord) => {
	const raised = Number(project.fundedSoFar || 0);
	const goal = Number(project.fundingGoal || 0);

	if (!goal) return '0% funded';

	const percent = Math.round((raised / goal) * 100);
	return `${percent}% funded`;
};

const getRaisedDisplay = (project: ProjectCardRecord) => {
	const raised = Number(project.fundedSoFar || 0);
	const goal = Number(project.fundingGoal || 0);
	return `${formatCurrency(String(raised))} of ${formatCurrency(String(goal))}`;
};

const getProgressWidth = (project: ProjectCardRecord) => {
	const raised = Number(project.fundedSoFar || 0);
	const goal = Number(project.fundingGoal || 0);

	if (!goal) return 0;
	return Math.min(100, Math.round((raised / goal) * 100));
};

export default function Projects() {
	const navigate = useNavigate();
	const [projects, setProjects] = useState<ProjectCardRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const openProject = (project: ProjectCardRecord) => {
		const isReadOnly =
			project.status === 'under_review' ||
			project.status === 'approved' ||
			project.status === 'issued' ||
			project.status === 'live' ||
			project.status === 'locked';

		navigate(
			isReadOnly
				? `/project-setup?projectId=${project.id}&mode=readonly`
				: `/project-setup?projectId=${project.id}`,
		);
	};

	useEffect(() => {
		const loadProjects = async () => {
			try {
				const response = await projectService.getMyProjects();
				const rows = (response ?? []).map((item: IProject) => mapProject(item));
				setProjects(rows);
			} catch (error) {
				console.error('Failed to load projects', error);
				setProjects([]);
			} finally {
				setIsLoading(false);
			}
		};

		void loadProjects();
	}, []);

	const underReview = useMemo(
		() => projects.filter((project) => project.status === 'under_review'),
		[projects],
	);

	const changesRequested = useMemo(
		() => projects.filter((project) => project.status === 'changes_requested'),
		[projects],
	);

	const approved = useMemo(
		() =>
			projects.filter((project) =>
				['approved', 'issued', 'live'].includes(project.status),
			),
		[projects],
	);

	const renderWorkflowCard = (
		project: ProjectCardRecord,
		statusLabel: string,
		statusClasses: string,
	) => (
		<div
			key={project.id}
			role="button"
			tabIndex={0}
			onClick={() => openProject(project)}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					openProject(project);
				}
			}}
			className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-xl font-semibold text-[#111827]">
						{project.projectName}
					</h3>
					<p className="mt-1 text-sm text-[#6B7280]">
						{project.projectType} • {project.dseType}
					</p>
				</div>

				<span
					className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}
				>
					{statusLabel}
				</span>
			</div>

			<div className="mt-5 space-y-2 text-sm text-[#6B7280]">
				<p>
					<span className="font-medium text-[#111827]">Stage:</span>{' '}
					{project.stage}
				</p>
				<p>
					<span className="font-medium text-[#111827]">Location:</span>{' '}
					{project.location || 'Not set'}
				</p>
				<p>
					<span className="font-medium text-[#111827]">Funding Goal:</span>{' '}
					{formatCurrency(project.fundingGoal)}
				</p>
				<p>
					<span className="font-medium text-[#111827]">Submitted:</span>{' '}
					{project.submittedAt
						? new Date(project.submittedAt).toLocaleDateString()
						: '—'}
				</p>
				{project.adminNotes ? (
					<p>
						<span className="font-medium text-[#111827]">Admin Notes:</span>{' '}
						{(() => {
							try {
								const parsed = JSON.parse(project.adminNotes || '{}');
								return parsed.adminNotes || project.adminNotes;
							} catch {
								return project.adminNotes;
							}
						})()}
					</p>
				) : null}
			</div>
		</div>
	);

	const renderApprovedCard = (project: ProjectCardRecord) => {
		const progressWidth = getProgressWidth(project);
		const progressText = getFundingProgressText(project);
		const raisedDisplay = getRaisedDisplay(project);
		const yieldDisplay =
			project.targetAnnualYield &&
			String(project.targetAnnualYield).trim() !== ''
				? `${project.targetAnnualYield}%`
				: '—';

		return (
			<article
				key={project.id}
				role="button"
				tabIndex={0}
				onClick={() => openProject(project)}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						openProject(project);
					}
				}}
				className="justify-self-start w-full max-w-[460px] overflow-hidden rounded-[30px] border border-[#E7ECF4] bg-white shadow-[0_20px_60px_rgba(17,40,75,0.08)] transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
			>
				<div className="relative h-[200px] w-full overflow-hidden bg-slate-100">
					{project.thumbnailImageUrl ? (
						<img
							src={project.thumbnailImageUrl}
							alt={project.projectName}
							className="h-full w-full object-cover object-[50%_10%]"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
							No image
						</div>
					)}
				</div>

				<div className="space-y-4 px-4 pb-4 pt-4 md:px-5 md:pb-5">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
								{project.stage === 'Operating'
									? 'Operating Asset'
									: `${project.stage} Asset`}
							</p>
							<h3 className="mt-1 text-[15px] font-semibold leading-snug text-[#111827]">
								{project.projectName}
							</h3>
						</div>

						<span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
							{project.dseType}
						</span>
					</div>

					<div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3.5">
						<div className="flex items-center justify-between text-[13px]">
							<span className="text-[#6B7280]">Raised</span>
							<span className="font-semibold text-[#111827]">
								{raisedDisplay}
							</span>
						</div>

						<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
							<div
								className="h-full rounded-full bg-emerald-500"
								style={{ width: `${progressWidth}%` }}
							/>
						</div>

						<div className="mt-2 text-right text-[13px] text-[#6B7280]">
							{progressText}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2.5">
						<div className="rounded-[20px] border border-slate-200 bg-white px-4 py-2.5">
							<p className="text-[11px] text-[#6B7280]">Min. Investment</p>
							<p className="mt-1.5 text-[18px] font-semibold text-[#111827]">
								{formatCurrency(project.minimumInvestment || '100')}
							</p>
						</div>

						<div className="rounded-[20px] border border-slate-200 bg-white px-4 py-2.5 text-right">
							<p className="text-[11px] text-[#6B7280]">Yield</p>
							<p className="mt-1.5 text-[18px] font-semibold text-emerald-600">
								{yieldDisplay}
							</p>
						</div>
					</div>

					<div className="rounded-[22px] border border-slate-200 bg-white p-3.5">
						<div className="grid grid-cols-[96px_1fr] gap-y-1.5 text-[13px]">
							<span className="text-[#6B7280]">Cashflow</span>
							<span className="text-right font-medium text-[#111827]">
								{project.cashflowLabel || 'Operating cashflows'}
							</span>

							<span className="text-[#6B7280]">Structure</span>
							<span className="text-right font-medium text-[#111827]">
								{project.structureLabel || 'SPV / trust linked'}
							</span>

							<span className="text-[#6B7280]">Settlement</span>
							<span className="text-right font-medium text-[#111827]">
								{project.settlementLabel || 'AUDD'}
							</span>
						</div>
					</div>

					<div>
						<button
							type="button"
							className="min-h-[52px] w-full rounded-[18px] bg-[#7DD3EA] px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#67C8E3]"
						>
							View
						</button>
					</div>
				</div>
			</article>
		);
	};

	return (
		<div>
			<div className="w-full">
				<div className="mb-8">
					<PageHeader
						label="Climate Developer Portal"
						title="Deal Room"
						description="Track submitted projects through review, revision, approval, and live capital readiness."
					/>
				</div>

				{isLoading ? (
					<div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-[#6B7280] shadow-sm">
						Loading projects...
					</div>
				) : (
					<div className="space-y-10">
						<section>
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-semibold text-[#111827]">
										Under Review
									</h2>
									<p className="mt-1 text-sm text-[#6B7280]">
										Submitted projects awaiting administrator decision.
									</p>
								</div>
							</div>

							{underReview.length ? (
								<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
									{underReview.map((project) =>
										renderWorkflowCard(
											project,
											'Under Review',
											'border border-amber-200 bg-amber-50 text-amber-700',
										),
									)}
								</div>
							) : (
								<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-[#6B7280]">
									No projects are currently under review.
								</div>
							)}
						</section>

						<section>
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-semibold text-[#111827]">
										Changes Requested
									</h2>
									<p className="mt-1 text-sm text-[#6B7280]">
										Projects requiring revisions before approval.
									</p>
								</div>
							</div>

							{changesRequested.length ? (
								<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
									{changesRequested.map((project) =>
										renderWorkflowCard(
											project,
											'Changes Requested',
											'border border-pink-200 bg-pink-50 text-pink-700',
										),
									)}
								</div>
							) : (
								<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-[#6B7280]">
									No projects currently require changes.
								</div>
							)}
						</section>

						<section>
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-semibold text-[#111827]">
										Approved / Issued / Live
									</h2>
									<p className="mt-1 text-sm text-[#6B7280]">
										Projects that have passed review and are progressing through
										issuance and live readiness.
									</p>
								</div>
							</div>

							{approved.length ? (
								<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
									{approved.map(renderApprovedCard)}
								</div>
							) : (
								<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-[#6B7280]">
									No approved projects yet.
								</div>
							)}
						</section>
					</div>
				)}
			</div>
		</div>
	);
}
