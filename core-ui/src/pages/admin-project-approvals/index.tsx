import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	AdminActionButton,
	AdminPageHeader,
	AdminSectionCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
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

const getDocsStatus = (project: SubmittedProjectRecord) => {
	const sections: Partial<Record<WorkflowKey, WorkflowStatus>> =
		project.workflowStatus ?? {};

	if (
		sections.documentsAndUploads === 'Completed' &&
		sections.legalStructure === 'Completed' &&
		sections.agreement === 'Completed'
	) {
		return 'Completed';
	}

	if (
		sections.documentsAndUploads === 'Not Started' &&
		sections.legalStructure === 'Not Started' &&
		sections.agreement === 'Not Started'
	) {
		return 'Not Started';
	}

	return 'In Progress';
};

const getTone = (status: string): 'yellow' | 'pink' | 'blue' | 'gray' => {
	switch (status) {
		case 'under_review':
			return 'yellow';
		case 'changes_requested':
			return 'pink';
		case 'approved':
		case 'issued':
		case 'live':
			return 'blue';
		default:
			return 'gray';
	}
};

export default function AdminProjectApprovals() {
	const navigate = useNavigate();
	const [projects, setProjects] = useState<SubmittedProjectRecord[]>([]);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>(
		'all',
	);
	const [typeFilter, setTypeFilter] = useState('all');

	useEffect(() => {
		const loadProjects = async () => {
			try {
				const response = await projectService.getAdminProjects();
				const parsed = (response ?? []).map((item: any) =>
					mapProject(item as IProject),
				);
				setProjects(parsed);
			} catch (error) {
				console.error('Failed to load submitted projects', error);
				setProjects([]);
			}
		};

		void loadProjects();
	}, []);

	const projectTypes = useMemo(() => {
		return Array.from(
			new Set(projects.map((project) => project.projectType).filter(Boolean)),
		);
	}, [projects]);

	const filteredProjects = useMemo(() => {
		return [...projects]
			.filter((project) => {
				const q = search.trim().toLowerCase();
				if (!q) return true;
				return (
					project.projectName.toLowerCase().includes(q) ||
					project.projectType.toLowerCase().includes(q) ||
					project.dseType.toLowerCase().includes(q) ||
					(project.location || '').toLowerCase().includes(q)
				);
			})
			.filter((project) =>
				statusFilter === 'all' ? true : project.status === statusFilter,
			)
			.filter((project) =>
				typeFilter === 'all' ? true : project.projectType === typeFilter,
			)
			.sort(
				(a, b) =>
					new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
			);
	}, [projects, search, statusFilter, typeFilter]);

	return (
		<div className="min-h-screen bg-[#F7F8FB] px-4 py-4">
			<div className="max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Project Approvals"
					description="Review submitted projects, filter by status, and progress approvals."
				/>

				<AdminSectionCard className="mb-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="rounded-[18px] border border-[#E6ECF5] bg-white px-4 py-3 text-sm text-[#101828] outline-none placeholder:text-[#98A2B3]"
							placeholder="Search project, type, or location"
						/>

						<select
							value={statusFilter}
							onChange={(event) =>
								setStatusFilter(event.target.value as 'all' | ProjectStatus)
							}
							className="rounded-[18px] border border-[#E6ECF5] bg-white px-4 py-3 text-sm text-[#101828] outline-none"
						>
							<option value="all">All statuses</option>
							<option value="under_review">Under Review</option>
							<option value="changes_requested">Changes Requested</option>
							<option value="approved">Approved</option>
							<option value="issued">Issued</option>
							<option value="live">Live</option>
							<option value="draft">Draft</option>
							<option value="locked">Locked</option>
						</select>

						<select
							value={typeFilter}
							onChange={(event) => setTypeFilter(event.target.value)}
							className="rounded-[18px] border border-[#E6ECF5] bg-white px-4 py-3 text-sm text-[#101828] outline-none"
						>
							<option value="all">All project types</option>
							{projectTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>

						<AdminActionButton
							tone="primary"
							className="w-full justify-center"
							onClick={() => window.print()}
						>
							Export Review List
						</AdminActionButton>
					</div>
				</AdminSectionCard>

				<AdminSectionCard>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-[#EEF2F7] text-left text-sm text-[#98A2B3]">
									<th className="pb-4 pr-4 font-medium">Project Name</th>
									<th className="pb-4 px-3 font-medium">Type</th>
									<th className="pb-4 px-3 font-medium">Stage</th>
									<th className="pb-4 px-3 font-medium">Target Raise</th>
									<th className="pb-4 px-3 font-medium">Minimum</th>
									<th className="pb-4 px-3 font-medium">Submitted</th>
									<th className="pb-4 px-3 font-medium">Docs</th>
									<th className="pb-4 px-3 font-medium">Approval</th>
									<th className="pb-4 pl-3 text-right font-medium">Actions</th>
								</tr>
							</thead>

							<tbody>
								{filteredProjects.map((project) => {
									const docsStatus = getDocsStatus(project);

									return (
										<tr
											key={project.id}
											className="border-b border-[#F2F4F7] last:border-b-0"
										>
											<td className="py-5 pr-4 align-top">
												<div className="text-[16px] font-semibold text-[#101828]">
													{project.projectName}
												</div>
												<div className="mt-1 text-sm text-[#98A2B3]">
													{project.location || 'No location'}
												</div>
											</td>

											<td className="px-3 py-5 align-top text-[15px] text-[#101828]">
												{project.projectType}
											</td>

											<td className="px-3 py-5 align-top text-[15px] text-[#101828]">
												{project.stage}
											</td>

											<td className="px-3 py-5 align-top text-[15px] font-medium text-[#101828]">
												{formatCurrency(project.fundingGoal)}
											</td>

											<td className="px-3 py-5 align-top text-[15px] text-[#101828]">
												{formatCurrency(project.minimumInvestment)}
											</td>

											<td className="px-3 py-5 align-top text-[15px] text-[#101828]">
												{project.submittedAt
													? new Date(project.submittedAt).toLocaleDateString(
															'en-AU',
													  )
													: '—'}
											</td>

											<td className="px-3 py-5 align-top">
												<AdminStatusBadge
													label={docsStatus}
													tone={getTone(docsStatus.toLowerCase())}
												/>
											</td>

											<td className="px-3 py-5 align-top">
												<AdminStatusBadge
													label={project.status}
													tone={getTone(project.status)}
												/>
											</td>

											<td className="py-5 pl-3 text-right align-top">
												<button
													type="button"
													onClick={() =>
														navigate(`/admin/project-approvals/${project.id}`)
													}
													className="inline-flex h-9 items-center justify-center rounded-[10px] border border-[#E7ECF4] bg-white px-3 text-xs font-semibold text-[#163F74] transition hover:bg-[#F5F9FF]"
												>
													Review
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						{filteredProjects.length === 0 ? (
							<div className="py-12 text-center text-sm text-[#98A2B3]">
								No projects found.
							</div>
						) : null}
					</div>
				</AdminSectionCard>
			</div>
		</div>
	);
}
