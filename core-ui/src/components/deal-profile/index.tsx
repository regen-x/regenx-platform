type DSEType = 'ODSE' | 'DDSE' | 'HDSE';

interface DealProfileProps {
	dseType: DSEType;
	projectName?: string;
	structureLabel?: string;
	cashflowType?: string;
	liquidityProfile?: string;
	settlementAsset?: string;
}

const riskConfig: Record<
	DSEType,
	{
		label: string;
		score: number;
		description: string;
		defaultCashflow: string;
		defaultLiquidity: string;
		defaultStructure: string;
	}
> = {
	ODSE: {
		label: 'Moderate Risk',
		score: 35,
		description:
			'Exposure to commissioned and operating clean energy assets with active or contracted revenue generation.',
		defaultCashflow: 'Operating cashflows',
		defaultLiquidity: 'Limited secondary liquidity',
		defaultStructure: 'Operational asset / SPV / trust-linked',
	},
	DDSE: {
		label: 'Higher Risk',
		score: 75,
		description:
			'Exposure to development or construction-stage projects prior to commissioning, with execution and delivery risk.',
		defaultCashflow: 'Pre-operational / milestone-based',
		defaultLiquidity: 'Low liquidity until operation or transfer event',
		defaultStructure: 'Development raise / SPV / project documents',
	},
	HDSE: {
		label: 'Blended Risk',
		score: 55,
		description:
			'Exposure to a mix of operating and development-stage assets, upgrades, or integrated infrastructure.',
		defaultCashflow: 'Blended operating and development exposure',
		defaultLiquidity: 'Limited liquidity with staged transition potential',
		defaultStructure: 'Hybrid structure / mixed asset exposure',
	},
};

const badgeStyles: Record<DSEType, string> = {
	ODSE: 'bg-green-100 text-green-700 border-green-200',
	DDSE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
	HDSE: 'bg-blue-100 text-blue-700 border-blue-200',
};

const badgeLabels: Record<DSEType, string> = {
	ODSE: 'Operating DSE',
	DDSE: 'Development DSE',
	HDSE: 'Hybrid DSE',
};

const getMeterWidthClass = (score: number) => {
	if (score <= 40) return 'w-[35%]';
	if (score <= 60) return 'w-[55%]';
	return 'w-[75%]';
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-start justify-between gap-4 py-3 border-b border-slate-200 last:border-b-0">
		<p className="text-sm text-slate-500 min-w-[120px]">{label}</p>
		<p className="text-sm text-right text-slate-900 font-medium">{value}</p>
	</div>
);

const DealProfile = ({
	dseType,
	projectName,
	structureLabel,
	cashflowType,
	liquidityProfile,
	settlementAsset,
}: DealProfileProps) => {
	const config = riskConfig[dseType];

	return (
		<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-[0.18em] text-slate-500">
							Deal Profile
						</p>
						<h3 className="text-xl font-semibold text-slate-900">
							{projectName || 'Project Investment Profile'}
						</h3>
					</div>

					<div
						className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles[dseType]}`}
					>
						{badgeLabels[dseType]}
					</div>
				</div>

				<div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
					<div className="flex items-center justify-between gap-4 mb-3">
						<p className="text-sm font-semibold text-slate-900">Risk Profile</p>
						<p className="text-sm font-medium text-slate-700">{config.label}</p>
					</div>

					<div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
						<div
							className={`h-full rounded-full bg-[#1D4ED8] ${getMeterWidthClass(
								config.score,
							)}`}
						/>
					</div>

					<div className="mt-3 flex items-center justify-between text-xs text-slate-500">
						<span>Lower</span>
						<span>Medium</span>
						<span>Higher</span>
					</div>

					<p className="mt-4 text-sm leading-6 text-slate-600">
						{config.description}
					</p>
				</div>

				<div className="rounded-2xl border border-slate-200 p-4">
					<InfoRow
						label="Cashflow Type"
						value={cashflowType || config.defaultCashflow}
					/>
					<InfoRow
						label="Liquidity"
						value={liquidityProfile || config.defaultLiquidity}
					/>
					<InfoRow
						label="Structure"
						value={structureLabel || config.defaultStructure}
					/>
					<InfoRow
						label="Settlement"
						value={settlementAsset || 'AUDD / wallet-signed settlement'}
					/>
				</div>
			</div>
		</div>
	);
};

export default DealProfile;
