import Button from '@/components/common/button';
import DSEBadge from '@/components/common/dse-badge';
import {
	getDseMeta,
	getDseTypeFromProject,
} from '@/utils/projects/get-dse-profile';

interface IProjectCardProps {
	id?: string;
	name: string;
	price: number;
	fundingGoal?: number;
	fundedSoFar?: number;
	thumbnailUrl?: string;
	onClick: () => void;
	dseType?: 'ODSE' | 'DDSE' | 'HDSE';
	projectType?: string;
	description?: string;
}

const ProjectCard: React.FC<IProjectCardProps> = ({
	id,
	name,
	fundingGoal,
	fundedSoFar,
	thumbnailUrl,
	onClick,
	dseType,
	projectType,
	description,
}: IProjectCardProps) => {
	const tokensPurchased = fundedSoFar ?? 0;
	const tokenPrice = 1;

	const raised = tokensPurchased * tokenPrice;
	const fundingTarget = fundingGoal ?? 0;

	const progressPercentage =
		fundingTarget > 0 ? Math.min((raised / fundingTarget) * 100, 100) : 0;

	const resolvedDseType = getDseTypeFromProject({
		dseType,
		name,
		projectType,
		description,
	});

	const dseMeta = getDseMeta(resolvedDseType);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg">
			<div className="h-[16rem] w-full overflow-hidden bg-custom-dark-blue">
				{thumbnailUrl ? (
					<img
						src={thumbnailUrl}
						alt={name}
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
						<h2
							className="text-[1.55rem] font-semibold leading-tight text-slate-900"
							data-test={`project-item-name-${id}`}
						>
							{name}
						</h2>
					</div>

					<DSEBadge type={resolvedDseType} />
				</div>

				<div className="flex flex-1 flex-col">
					<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
						<div className="flex items-center justify-between text-sm">
							<span className="text-slate-500">Raised</span>
							<span className="font-medium text-slate-700">
								${raised.toLocaleString()} of ${fundingTarget.toLocaleString()}
							</span>
						</div>

						<div className="mt-3 h-2.5 w-full rounded-full bg-slate-200">
							<div
								className="h-2.5 rounded-full bg-green-500"
								style={{ width: `${progressPercentage}%` }}
							/>
						</div>

						<div className="mt-3 text-right text-sm text-slate-500">
							{progressPercentage.toFixed(0)}% funded
						</div>
					</div>

					<div className="mt-4 grid grid-cols-2 gap-3">
						<div className="rounded-xl border border-slate-200 p-4">
							<p className="text-xs text-slate-500">Min. Investment</p>
							<p
								className="mt-1 text-xl font-bold text-slate-900"
								data-test={`project-item-price-${id}`}
							>
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
							onClick={onClick}
							className="w-full"
							dataTest={`project-item-view-${id}`}
						>
							View
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProjectCard;
