import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminPageHeader } from '@/components/admin-ui';
import { IProject } from '@/interfaces/api/IProject';
import { projectService } from '@/services/project.service';

type WorkflowKey =
	| 'projectOverview'
	| 'assetDescription'
	| 'technicalDetails'
	| 'commercialModel'
	| 'useOfFunds'
	| 'complianceAndRisks'
	| 'legalStructure'
	| 'documentsAndUploads'
	| 'agreement';

type WorkflowStatus = 'Not Started' | 'In Progress' | 'Completed';
type ProjectStatus =
	| 'draft'
	| 'under_review'
	| 'changes_requested'
	| 'approved'
	| 'issued'
	| 'live'
	| 'locked';

type SubmittedProjectRecord = {
	id: string;
	projectName: string;
	dseType: string;
	projectType: string;
	stage: string;
	fundingGoal: string;
	minimumInvestment: string;
	location: string;
	jurisdiction: string;
	thumbnailImageUrl: string;
	progressPercent: number;
	status: ProjectStatus;
	submittedAt: string;
	adminNotes: string;
	workflowStatus?: Record<WorkflowKey, WorkflowStatus>;
	completedCount?: number;
	totalSections?: number;
};

const getStatusClasses = (status: string) => {
	switch (status) {
		case 'under_review':
			return 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]';
		case 'changes_requested':
			return 'bg-[#FCE7F3] text-[#BE185D] border border-[#F9A8D4]';
		case 'approved':
			return 'bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]';
		case 'issued':
			return 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]';
		case 'live':
			return 'bg-[#E0F2FE] text-[#0369A1] border border-[#7DD3FC]';
		case 'locked':
			return 'bg-[#F3F4F6] text-[#4B5563] border border-[#D1D5DB]';
		default:
			return 'bg-[#F3F4F6] text-[#6B7280] border border-[#D1D5DB]';
	}
};

const KpiCard = ({
	title,
	value,
	subtitle,
	accent,
	onClick,
}: {
	title: string;
	value: string;
	subtitle: string;
	accent: 'blue' | 'pink' | 'yellow' | 'red';
	onClick: () => void;
}) => {
	const accentClass =
		accent === 'blue'
			? 'before:bg-[#38BDF8]'
			: accent === 'pink'
			? 'before:bg-[#EC4899]'
			: accent === 'yellow'
			? 'before:bg-[#F59E0B]'
			: 'before:bg-[#F43F5E]';

	return (
		<button
			type="button"
			onClick={onClick}
			className={`theme-surface relative overflow-hidden rounded-[18px] border px-5 py-4 text-left transition hover:-translate-y-[1px] hover:shadow-md before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] ${accentClass}`}
		>
			<p className="theme-text-secondary text-[13px] font-semibold">{title}</p>
			<h3 className="theme-heading mt-2 text-[21px] font-semibold leading-none">
				{value}
			</h3>
			<p className="theme-text-secondary mt-2 text-[13px] leading-[1.4]">
				{subtitle}
			</p>
		</button>
	);
};

const SectionCard = ({
	title,
	rightText,
	children,
}: {
	title: string;
	rightText?: string;
	children: React.ReactNode;
}) => {
	return (
		<div className="theme-surface rounded-[18px] border p-6">
			<div className="theme-border mb-5 flex items-center justify-between border-b pb-4">
				<h2 className="theme-heading text-[20px] font-semibold">{title}</h2>
				{rightText ? (
					<span className="theme-text-secondary text-sm">{rightText}</span>
				) : null}
			</div>
			{children}
		</div>
	);
};

const formatCurrency = (value?: string) => {
	const raw = String(value ?? '')
		.replace(/,/g, '')
		.trim();
	const num = Number(raw);
	if (!raw || Number.isNaN(num)) return '—';
	return `$${num.toLocaleString()}`;
};

const mapProject = (project: IProject): SubmittedProjectRecord => {
	const payload = (project.payloadJson ?? {}) as Record<string, any>;
	const form = (payload.form ?? payload) as Record<string, any>;

	return {
		id: String(project.id ?? ''),
		projectName: form.projectName ?? project.name ?? 'Untitled Project',
		dseType: form.dseType ?? project.dseType ?? 'Operating DSE',
		projectType: form.projectType ?? project.projectType ?? 'Solar',
		stage: form.stage ?? project.stage ?? 'Development',
		fundingGoal: String(form.fundingGoal ?? project.fundingGoal ?? '0'),
		minimumInvestment: String(
			form.minimumInvestment ?? project.minimumInvestment ?? '',
		),
		location: form.fullAddress ?? form.location ?? project.location ?? '',
		jurisdiction: form.jurisdiction ?? project.jurisdiction ?? '',
		thumbnailImageUrl: form.thumbnailImageUrl ?? project.thumbnailUrl ?? '',
		progressPercent:
			project.totalSections && project.completedCount
				? Math.round((project.completedCount / project.totalSections) * 100)
				: 0,
		status: (project.status as ProjectStatus) ?? 'draft',
		submittedAt:
			project.submittedAt ?? project.updatedAt ?? project.createdAt ?? '',
		adminNotes: project.adminNotes ?? '',
		workflowStatus:
			(project.workflowStatusJson as
				| Record<WorkflowKey, WorkflowStatus>
				| undefined) ?? undefined,
		completedCount: project.completedCount ?? 0,
		totalSections: project.totalSections ?? 0,
	};
};

export default function AdminDashboard() {
	const navigate = useNavigate();
	const [projects, setProjects] = useState<SubmittedProjectRecord[]>([]);

	useEffect(() => {
		const loadProjects = async () => {
			try {
				const response = await projectService.getAdminProjects();
				setProjects((response ?? []).map((item: IProject) => mapProject(item)));
			} catch (error) {
				console.error('Failed to load submitted projects', error);
				setProjects([]);
			}
		};

		void loadProjects();
	}, []);

	const pendingProjects = useMemo(
		() => projects.filter((project) => project.status === 'under_review'),
		[projects],
	);

	const changesRequestedProjects = useMemo(
		() => projects.filter((project) => project.status === 'changes_requested'),
		[projects],
	);

	const approvedProjects = useMemo(
		() =>
			projects.filter(
				(project) =>
					project.status === 'approved' ||
					project.status === 'issued' ||
					project.status === 'live',
			),
		[projects],
	);

	const approvedOnlyProjects = useMemo(
		() => projects.filter((project) => project.status === 'approved'),
		[projects],
	);

	const issuedProjects = useMemo(
		() => projects.filter((project) => project.status === 'issued'),
		[projects],
	);

	const liveProjects = useMemo(
		() => projects.filter((project) => project.status === 'live'),
		[projects],
	);

	const incompleteDocsCount = useMemo(() => {
		return projects.filter((project) => {
			const sections = project.workflowStatus ?? {};
			return (
				sections.documentsAndUploads !== 'Completed' ||
				sections.agreement !== 'Completed' ||
				sections.legalStructure !== 'Completed'
			);
		}).length;
	}, [projects]);

	const reviewQueue = useMemo(() => {
		return [...projects]
			.filter(
				(project) =>
					project.status === 'under_review' ||
					project.status === 'changes_requested',
			)
			.sort(
				(a, b) =>
					new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
			)
			.slice(0, 5);
	}, [projects]);

	const recentAuditEvents = useMemo(() => {
		const items: Array<{ label: string; sublabel: string; time: string }> = [];

		projects.forEach((project) => {
			const submitted = new Date(project.submittedAt);
			items.push({
				label: `Submission received for ${project.projectName}`,
				sublabel: project.status.replace(/_/g, ' '),
				time: submitted.toLocaleDateString(),
			});

			if (project.adminNotes?.trim()) {
				items.push({
					label: `Admin notes saved for ${project.projectName}`,
					sublabel: project.adminNotes.trim().slice(0, 80),
					time: submitted.toLocaleDateString(),
				});
			}

			if (project.status === 'approved') {
				items.push({
					label: `Approved ${project.projectName}`,
					sublabel: 'Ready for issuance',
					time: submitted.toLocaleDateString(),
				});
			}

			if (project.status === 'issued') {
				items.push({
					label: `Issued ${project.projectName}`,
					sublabel: 'Ready for live activation',
					time: submitted.toLocaleDateString(),
				});
			}

			if (project.status === 'live') {
				items.push({
					label: `Promoted ${project.projectName} live`,
					sublabel: 'Visible to investors',
					time: submitted.toLocaleDateString(),
				});
			}

			if (project.status === 'changes_requested') {
				items.push({
					label: `Requested changes for ${project.projectName}`,
					sublabel: 'Returned to climate developer for revision',
					time: submitted.toLocaleDateString(),
				});
			}
		});

		return items.slice(0, 6);
	}, [projects]);

	return (
		<div className="theme-page-shell min-h-screen px-4 py-4">
			<div className="max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Admin Dashboard"
					description="Review project pipeline health, approvals waiting for action, and recent administrator activity."
				/>

				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
					<KpiCard
						title="Projects Pending Review"
						value={String(pendingProjects.length)}
						subtitle="Awaiting administrator review"
						accent="pink"
						onClick={() => navigate('/admin/project-approvals')}
					/>
					<KpiCard
						title="Changes Requested"
						value={String(changesRequestedProjects.length)}
						subtitle="Returned to developers for updates"
						accent="yellow"
						onClick={() => navigate('/admin/project-approvals')}
					/>
					<KpiCard
						title="Approved / Live"
						value={String(approvedProjects.length)}
						subtitle="Approved, issued, or live projects"
						accent="blue"
						onClick={() => navigate('/admin/project-approvals')}
					/>
					<KpiCard
						title="Incomplete Legal / Docs"
						value={String(incompleteDocsCount)}
						subtitle="Submissions missing core documents"
						accent="red"
						onClick={() => navigate('/admin/project-approvals')}
					/>
				</div>

				<div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[18px] border border-[#F2D28B] bg-[#FFF8E7] px-6 py-5 md:flex-row md:items-center">
					<div className="flex items-start gap-4">
						<div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#FDE7B0] text-[#B45309]">
							!
						</div>
						<div>
							<p className="text-lg font-semibold text-[#163F74]">
								{incompleteDocsCount} project
								{substantialPlural(incompleteDocsCount)} have incomplete
								documentation
							</p>
							<p className="text-sm text-[#5F6C86]">
								Review legal structure, agreement, and uploads before approval
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={() => navigate('/admin/project-approvals')}
						className="rounded-[14px] border border-[#2F80ED] bg-[#2F80ED] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2775E0]"
					>
						Review Now
					</button>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
					<div className="xl:col-span-7">
						<SectionCard title="Pending Project Approvals">
							<div className="overflow-x-auto">
								<table className="min-w-full border-separate border-spacing-y-3">
									<thead>
										<tr className="text-left text-sm text-[#98A2B3]">
											<th className="pb-1 font-medium uppercase tracking-[0.08em]">
												Project Name
											</th>
											<th className="pb-1 font-medium uppercase tracking-[0.08em]">
												Type
											</th>
											<th className="pb-1 font-medium uppercase tracking-[0.08em]">
												Submitted
											</th>
											<th className="pb-1 font-medium uppercase tracking-[0.08em]">
												Raise Target
											</th>
											<th className="pb-1 font-medium uppercase tracking-[0.08em]">
												Status
											</th>
											<th className="pb-1 font-medium uppercase tracking-[0.08em]">
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{reviewQueue.map((project) => (
											<tr
												key={project.id}
												className="rounded-[18px] bg-[#FCFDFE] text-sm text-[#163F74]"
											>
												<td className="rounded-l-2xl px-3 py-4">
													<div className="font-medium">
														{project.projectName}
													</div>
													<div className="mt-1 text-xs text-[#5F6C86]">
														{project.location || 'No location yet'}
													</div>
												</td>
												<td className="px-3 py-4">{project.projectType}</td>
												<td className="px-3 py-4">
													{new Date(project.submittedAt).toLocaleDateString()}
												</td>
												<td className="px-3 py-4">
													{formatCurrency(project.fundingGoal)}
												</td>
												<td className="px-3 py-4">
													<span
														className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
															project.status,
														)}`}
													>
														{project.status.replace(/_/g, ' ')}
													</span>
												</td>
												<td className="rounded-r-2xl px-3 py-4">
													<button
														type="button"
														onClick={() =>
															navigate(`/admin/project-approvals/${project.id}`)
														}
														className="rounded-[14px] border border-[#2F80ED] bg-[#2F80ED] px-4 py-2 text-sm font-semibold text-white"
													>
														Review
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>

								{reviewQueue.length === 0 ? (
									<div className="rounded-[18px] border border-dashed border-[#DCE7F5] px-4 py-10 text-center text-sm text-[#5F6C86]">
										No projects are currently waiting for review.
									</div>
								) : null}
							</div>
						</SectionCard>
					</div>

					<div className="xl:col-span-5">
						<SectionCard title="Review Breakdown">
							<div className="space-y-3">
								<div className="flex items-center justify-between rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-3">
									<span className="text-sm font-medium text-[#163F74]">
										Under review
									</span>
									<span
										className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
											'under_review',
										)}`}
									>
										{pendingProjects.length}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-3">
									<span className="text-sm font-medium text-[#163F74]">
										Changes requested
									</span>
									<span
										className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
											'changes_requested',
										)}`}
									>
										{changesRequestedProjects.length}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-3">
									<span className="text-sm font-medium text-[#163F74]">
										Approved
									</span>
									<span
										className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
											'approved',
										)}`}
									>
										{approvedOnlyProjects.length}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-3">
									<span className="text-sm font-medium text-[#163F74]">
										Issued
									</span>
									<span
										className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
											'issued',
										)}`}
									>
										{issuedProjects.length}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-3">
									<span className="text-sm font-medium text-[#163F74]">
										Live
									</span>
									<span
										className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
											'live',
										)}`}
									>
										{liveProjects.length}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-3">
									<span className="text-sm font-medium text-[#163F74]">
										Incomplete legal / docs
									</span>
									<span className="inline-flex rounded-full border border-[#FCA5A5] bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#B91C1C]">
										{incompleteDocsCount}
									</span>
								</div>
							</div>
						</SectionCard>
					</div>
				</div>

				<div className="mt-6">
					<SectionCard title="Recent Admin Events">
						<div className="space-y-3">
							{recentAuditEvents.map((event, index) => (
								<div
									key={`${event.label}-${index}`}
									className="rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-4"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="text-sm font-semibold text-[#163F74]">
												{event.label}
											</p>
											<p className="mt-1 text-xs text-[#5F6C86]">
												{event.sublabel || '—'}
											</p>
										</div>
										<span className="text-xs text-[#5F6C86]">{event.time}</span>
									</div>
								</div>
							))}

							{recentAuditEvents.length === 0 ? (
								<div className="rounded-[18px] border border-dashed border-[#DCE7F5] px-4 py-10 text-center text-sm text-[#5F6C86]">
									No admin activity yet.
								</div>
							) : null}
						</div>
					</SectionCard>
				</div>
			</div>
		</div>
	);
}

function substantialPlural(count: number) {
	return count === 1 ? '' : 's';
}
