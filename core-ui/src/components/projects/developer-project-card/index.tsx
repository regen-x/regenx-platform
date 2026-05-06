import Button from '@/components/common/button';
import DSEBadge from '@/components/common/dse-badge';
import { IProject } from '@/interfaces/api/IProject';
import {
	getDseMeta,
	getDseTypeFromProject,
} from '@/utils/projects/get-dse-profile';

interface IDeveloperProjectCardProps {
	project: IProject;
	onPrimaryAction: () => void;
}

const getWorkflowStatus = (project: IProject) => {
	const rawStatus = String(
		(project as any).approvalStatus ??
			(project as any).reviewStatus ??
			(project as any).status ??
			'',
	).toLowerCase();

	if (
		[
			'approved',
			'live',
			'verified',
			'greenlit',
			'green_lit',
			'green-lit',
		].includes(rawStatus)
	) {
		return 'approved';
	}

	if (
		[
			'under_review',
			'under review',
			'submitted',
			'ready_for_review',
			'ready for review',
			'pending_review',
		].includes(rawStatus)
	) {
		return 'under_review';
	}

	return 'draft';
};

const getPrimaryButtonLabel = (project: IProject) => {
	const workflowStatus = getWorkflowStatus(project);

	if (workflowStatus === 'approved') return 'View project';
	if (workflowStatus === 'under_review') return 'View submission';
	return 'Edit project';
};

const getStatusPill = (project: IProject) => {
	const workflowStatus = getWorkflowStatus(project);

	if (workflowStatus === 'approved') {
		return {
			label: 'Approved',
			classes: 'bg-emerald-100 text-emerald-700',
		};
	}

	if (workflowStatus === 'under_review') {
		return {
			label: 'Under Review',
			classes: 'bg-amber-100 text-amber-700',
		};
	}

	return {
		label: 'Draft',
		classes: 'bg-slate-100 text-slate-700',
	};
};

const DeveloperProjectCard: React.FC<IDeveloperProjectCardProps> = ({
	project,
	onPrimaryAction,
}: IDeveloperProjectCardProps) => {
	const fundedSoFar = Number(project.fundedSoFar ?? 0);
	const fundingGoal = Number(project.fundingGoal ?? 0);
	const tokenPrice = 1;
	const percentFunded =
		Number(project.percentFunded ?? 0) > 0
			? Math.min(100, Number(project.percentFunded ?? 0))
			: fundingGoal > 0
			? Math.min((fundedSoFar / fundingGoal) * 100, 100)
			: 0;

	const resolvedDseType = getDseTypeFromProject({
		dseType: (project as any).dseType,
		name: project.name,
		projectType: (project as any).projectType,
		description: project.description,
	});

	const dseMeta = getDseMeta(resolvedDseType);
	const statusPill = getStatusPill(project);
	const primaryLabel = getPrimaryButtonLabel(project);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg">
			<div className="h-[16rem] w-full overflow-hidden bg-custom-dark-blue">
				{project.thumbnailUrl ? (
					<img
						src={project.thumbnailUrl}
						alt={project.name}
						className="h-full w-full object-cover object-center"
						onError={(e) => {
							e.currentTarget.style.display = 'none';
						}}
					/>
				) : null}
			</div>

			<div className="flex flex-1 flex-col p-4">
				<div className="mb-3 flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
							{dseMeta.sectorLabel}
						</p>
						<h2 className="text-[1.55rem] font-semibold leading-tight text-slate-900">
							{project.name}
						</h2>
					</div>

					<DSEBadge type={resolvedDseType} />
				</div>

				<div className="mb-4 flex items-center justify-between">
					<span
						className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill.classes}`}
					>
						{statusPill.label}
					</span>

					<span className="text-sm text-slate-500">
						{percentFunded.toFixed(0)}% funded
					</span>
				</div>

				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<div className="flex items-center justify-between text-sm">
						<span className="text-slate-500">Raised</span>
						<span className="font-medium text-slate-700">
							${fundedSoFar.toLocaleString()} of ${fundingGoal.toLocaleString()}
						</span>
					</div>

					<div className="mt-3 h-2.5 w-full rounded-full bg-slate-200">
						<div
							className="h-2.5 rounded-full bg-green-500"
							style={{ width: `${percentFunded}%` }}
						/>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-3">
					<div className="rounded-xl border border-slate-200 p-4">
						<p className="text-xs text-slate-500">Min. Investment</p>
						<p className="mt-1 text-xl font-bold text-slate-900">
							${tokenPrice.toLocaleString()}
						</p>
					</div>

					<div className="rounded-xl border border-slate-200 p-4 text-right">
						<p className="text-xs text-slate-500">Profile</p>
						<p className="mt-1 text-base font-semibold text-green-600">
							{dseMeta.yieldLabel}
						</p>
					</div>
				</div>

				<div className="mt-4 space-y-2 rounded-xl border border-slate-200 p-4">
					<div className="flex items-center justify-between text-sm">
						<span className="text-slate-500">Cashflow</span>
						<span className="font-medium text-slate-900">
							{dseMeta.cashflowLabel}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-slate-500">Structure</span>
						<span className="font-medium text-slate-900">
							{dseMeta.structureLabel}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-slate-500">Settlement</span>
						<span className="font-medium text-slate-900">AUDD</span>
					</div>
				</div>

				<div className="mt-auto pt-5">
					<Button
						type="button"
						onClick={onPrimaryAction}
						className="w-full"
						dataTest={`developer-project-action-${project.id}`}
					>
						{primaryLabel}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default DeveloperProjectCard;
