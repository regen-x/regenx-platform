type Props = {
	project: any;
	onOpen?: (id: number) => void;
};

export default function OpportunityCard({ project, onOpen }: Props) {
	const title = project.name || 'Untitled Project';
	const location = project.location || '';
	const type = project.projectType || '';
	const stage = project.stage || '';

	const yieldVal = project.targetAnnualYield
		? `${project.targetAnnualYield}%`
		: '-';

	const irrVal = project.targetIrr ? `${project.targetIrr}%` : '-';

	const termVal = project.investmentTermYears
		? `${project.investmentTermYears} yrs`
		: '-';

	const thumbnail =
		project.thumbnailUrl ||
		'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1200&q=80';

	return (
		<div className="overflow-hidden rounded-2xl border border-[#E7ECF4] bg-white shadow-sm">
			<div className="relative h-40 w-full overflow-hidden">
				<img
					src={thumbnail}
					alt={title}
					className="h-full w-full object-cover"
				/>

				<div className="absolute left-3 top-3 flex gap-2">
					<span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">
						{type}
					</span>
					<span className="rounded-full bg-[#DDEBFF] px-3 py-1 text-xs font-semibold text-[#346FB6]">
						{stage}
					</span>
				</div>
			</div>

			<div className="p-4">
				<h3 className="text-sm font-semibold text-[#111827]">{title}</h3>

				<p className="mt-1 text-xs text-gray-500">{location}</p>

				<div className="mt-4 grid grid-cols-3 gap-2">
					<div className="rounded-lg border p-2 text-center">
						<div className="text-[10px] text-gray-500">YIELD</div>
						<div className="text-sm font-semibold">{yieldVal}</div>
					</div>
					<div className="rounded-lg border p-2 text-center">
						<div className="text-[10px] text-gray-500">IRR</div>
						<div className="text-sm font-semibold">{irrVal}</div>
					</div>
					<div className="rounded-lg border p-2 text-center">
						<div className="text-[10px] text-gray-500">TERM</div>
						<div className="text-sm font-semibold">{termVal}</div>
					</div>
				</div>

				<div className="mt-4 flex justify-end">
					<button
						onClick={() => onOpen?.(project.id)}
						className="text-sm font-semibold text-blue-600"
					>
						OPEN
					</button>
				</div>
			</div>
		</div>
	);
}
