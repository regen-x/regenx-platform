type DSEType = 'ODSE' | 'DDSE' | 'HDSE';

interface DSESelectorProps {
	value?: DSEType;
	onChange: (value: DSEType) => void;
}

const options: {
	type: DSEType;
	title: string;
	description: string;
	color: string;
}[] = [
	{
		type: 'ODSE',
		title: 'Operating DSE',
		description: 'Operational asset generating revenue',
		color: 'border-emerald-400 bg-emerald-50',
	},
	{
		type: 'DDSE',
		title: 'Development DSE',
		description: 'Pre-construction or construction stage project',
		color: 'border-amber-400 bg-amber-50',
	},
	{
		type: 'HDSE',
		title: 'Hybrid DSE',
		description: 'Combination of operating and development assets',
		color: 'border-blue-400 bg-blue-50',
	},
];

const DSESelector = ({ value, onChange }: DSESelectorProps) => {
	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm font-semibold text-slate-700">
				Project Structure & Risk Profile
			</p>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				{options.map((opt) => {
					const isSelected = value === opt.type;

					return (
						<div
							key={opt.type}
							onClick={() => onChange(opt.type)}
							className={`cursor-pointer rounded-xl border p-4 transition-all ${
								isSelected
									? `${opt.color} border-2`
									: 'border-slate-200 hover:border-slate-300'
							}`}
						>
							<p className="font-semibold text-slate-900">{opt.title}</p>
							<p className="text-sm text-slate-600 mt-1">{opt.description}</p>
						</div>
					);
				})}
			</div>

			<p className="text-xs text-slate-500">
				This classification determines how your project is presented to
				investors.
			</p>
		</div>
	);
};

export default DSESelector;
