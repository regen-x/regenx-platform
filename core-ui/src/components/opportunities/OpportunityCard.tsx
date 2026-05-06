import { Link } from 'react-router-dom';

type Props = {
	project: any;
	onOpen?: (id: number) => void;
};

function toNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const normalized = Number(value.replace(/[^0-9.-]/g, ''));
		return Number.isFinite(normalized) ? normalized : null;
	}

	return null;
}

function formatCurrency(value: unknown, fallback = '-'): string {
	const amount = toNumber(value);
	if (amount === null) return fallback;

	return new Intl.NumberFormat('en-AU', {
		style: 'currency',
		currency: 'AUD',
		maximumFractionDigits: amount >= 100 ? 0 : 2,
	}).format(amount);
}

function formatPercent(value: unknown): string {
	const amount = toNumber(value);
	return amount === null ? '-' : `${amount}%`;
}

function getStatusMeta(statusValue: unknown) {
	const status = String(statusValue || '').toLowerCase();

	if (status === 'approved') {
		return {
			label: 'Approved',
			className: 'border-[#D9E7FF] bg-[#EEF4FF] text-[#1D4ED8]',
		};
	}

	if (status === 'issued') {
		return {
			label: 'Issued',
			className: 'border-[#D8F0E4] bg-[#EFFAF4] text-[#16794F]',
		};
	}

	if (status === 'live') {
		return {
			label: 'Live',
			className: 'border-[#CFEBDD] bg-[#ECFDF5] text-[#0E7490]',
		};
	}

	return {
		label: status
			? status.charAt(0).toUpperCase() + status.slice(1)
			: 'Unknown',
		className: 'border-[#E5E7EB] bg-[#F8FAFC] text-[#475569]',
	};
}

function getStageLabel(stageValue: unknown): string {
	const stage = String(stageValue || '').trim();
	return stage || 'Institutional opportunity';
}

function getAssetLabel(project: any): string {
	const type = String(project.projectType || '').trim();
	const stage = String(project.stage || '')
		.trim()
		.toLowerCase();

	if (type) return type.toUpperCase();
	if (stage === 'operating') return 'OPERATING ASSET';
	if (stage === 'construction') return 'CONSTRUCTION ASSET';
	if (stage === 'development') return 'DEVELOPMENT ASSET';
	return 'CLIMATE INFRASTRUCTURE';
}

function getDseLabel(dseTypeValue: unknown, stageValue: unknown): string {
	const dseType = String(dseTypeValue || '')
		.trim()
		.toUpperCase();
	if (dseType === 'ODSE') return 'Operating DSE';
	if (dseType === 'DDSE') return 'Development DSE';
	if (dseType === 'HDSE') return 'Hybrid DSE';

	const stage = String(stageValue || '')
		.trim()
		.toLowerCase();
	if (stage === 'operating') return 'Operating DSE';
	if (stage === 'development') return 'Development DSE';
	if (stage === 'construction') return 'Hybrid DSE';
	return 'Deal Room';
}

function getSettlementLabel(project: any): string {
	const settlementAsset = String(project.settlementAsset || '').trim();
	const settlementCurrency = String(project.settlementCurrency || '').trim();
	const payload = project.payloadJson || {};
	const payloadSettlementAsset = String(payload.settlementAsset || '').trim();
	const payloadSettlementCurrency = String(
		payload.settlementCurrency || '',
	).trim();

	const asset = settlementAsset || payloadSettlementAsset;
	const currency = settlementCurrency || payloadSettlementCurrency;

	if (asset && currency) return `${asset} / ${currency}`;
	if (asset) return asset;
	if (currency) return currency;
	return 'Wallet-signed settlement';
}

function getStructureLabel(project: any): string {
	const payload = project.payloadJson || {};
	const structureLabel = String(
		payload.structureLabel || payload.structure || payload.legalStructure || '',
	).trim();

	if (structureLabel) return structureLabel;
	if (project.seriesId) return 'Series issuance';
	if (project.spvId) return 'SPV-linked offering';
	return 'Direct project allocation';
}

export default function OpportunityCard({ project, onOpen }: Props) {
	const title = project.name || 'Untitled Project';
	const location = project.location || '';
	const thumbnail = project.thumbnailUrl || '';
	const statusMeta = getStatusMeta(project.status);
	const assetLabel = getAssetLabel(project);
	const dseLabel = getDseLabel(project.dseType, project.stage);
	const stageLabel = getStageLabel(project.stage);
	const structureLabel = getStructureLabel(project);
	const settlementLabel = getSettlementLabel(project);

	const fundedSoFar =
		toNumber(project.fundedSoFar) ?? toNumber(project.amountSettled) ?? 0;
	const fundingGoal = toNumber(project.fundingGoal);
	const explicitPercentFunded = toNumber(project.percentFunded);
	const computedPercentFunded =
		fundingGoal && fundingGoal > 0
			? Math.min(100, Math.max(0, (fundedSoFar / fundingGoal) * 100))
			: 0;
	const percentFunded =
		explicitPercentFunded === null
			? computedPercentFunded
			: Math.min(100, Math.max(0, explicitPercentFunded));

	const minimumInvestment = formatCurrency(project.minimumInvestment);
	const yieldValue = formatPercent(project.targetAnnualYield);
	const irrValue = formatPercent(project.targetIrr);
	const termValue =
		toNumber(project.investmentTermYears) === null
			? '-'
			: `${toNumber(project.investmentTermYears)} yrs`;

	const ctaLabel =
		String(project.status || '').toLowerCase() === 'live'
			? 'View Opportunity'
			: 'View Details';

	return (
		<div className="overflow-hidden rounded-[30px] border border-[#E7ECF4] bg-white shadow-[0_20px_60px_rgba(17,40,75,0.08)] transition-transform duration-200 hover:-translate-y-0.5">
			<div className="relative h-[200px] w-full overflow-hidden bg-[linear-gradient(135deg,#EAF1F8_0%,#D9E8F3_100%)]">
				{thumbnail ? (
					<img
						src={thumbnail}
						alt={title}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(141,198,231,0.85),_rgba(227,234,243,0.65)_45%,_rgba(245,248,252,0.95)_100%)] p-6">
						<div className="rounded-full border border-white/50 bg-white/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#346FB6] backdrop-blur-sm">
							Institutional opportunity
						</div>
					</div>
				)}
			</div>

			<div className="space-y-4 px-4 pb-4 pt-4 md:px-5 md:pb-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6D7D97]">
							{assetLabel}
						</p>
						<h3 className="mt-1.5 text-[20px] font-semibold leading-tight text-[#11284B] md:text-[22px]">
							{title}
						</h3>
						<div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-[#5F6C86]">
							{location ? <span>{location}</span> : null}
							<span className="text-[#C7D2E3]">•</span>
							<span>{stageLabel}</span>
						</div>
					</div>

					<div className="flex flex-col items-start gap-1.5 md:items-end">
						<span className="inline-flex items-center rounded-full border border-[#DCE8F5] bg-[#F8FBFE] px-3 py-1 text-[10px] font-semibold text-[#346FB6]">
							{dseLabel}
						</span>
						<span
							className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${statusMeta.className}`}
						>
							{statusMeta.label}
						</span>
					</div>
				</div>

				<div className="rounded-[22px] border border-[#E3EAF3] bg-[#F8FBFE] p-3.5 shadow-[0_10px_26px_rgba(17,40,75,0.04)]">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-sm font-semibold text-[#163F74]">Raised</p>
							<p className="mt-1 text-[16px] font-semibold text-[#11284B] md:text-[17px]">
								{formatCurrency(fundedSoFar, '$0')} of{' '}
								{formatCurrency(fundingGoal)}
							</p>
						</div>
						<p className="text-sm font-semibold text-[#346FB6]">
							{Math.round(percentFunded)}% funded
						</p>
					</div>

					<div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#DCE8F5]">
						<div
							className="h-full rounded-full bg-[linear-gradient(90deg,#2E6AB3_0%,#8DC6E7_100%)]"
							style={{ width: `${percentFunded}%` }}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2.5">
					<div className="rounded-[20px] border border-[#E7ECF4] bg-white px-4 py-2.5">
						<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6D7D97]">
							Min. Investment
						</p>
						<p className="mt-1.5 text-[17px] font-semibold text-[#11284B]">
							{minimumInvestment}
						</p>
					</div>
					<div className="rounded-[20px] border border-[#E7ECF4] bg-white px-4 py-2.5">
						<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6D7D97]">
							Yield
						</p>
						<p className="mt-1.5 text-[17px] font-semibold text-[#11284B]">
							{yieldValue}
						</p>
					</div>
				</div>

				{irrValue !== '-' || termValue !== '-' ? (
					<div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[#5F6C86]">
						{irrValue !== '-' ? (
							<div className="flex items-center gap-2">
								<span className="font-medium text-[#6D7D97]">IRR</span>
								<span className="font-semibold text-[#163F74]">{irrValue}</span>
							</div>
						) : null}
						{termValue !== '-' ? (
							<div className="flex items-center gap-2">
								<span className="font-medium text-[#6D7D97]">Term</span>
								<span className="font-semibold text-[#163F74]">
									{termValue}
								</span>
							</div>
						) : null}
					</div>
				) : null}

				<div className="rounded-[22px] border border-[#E7ECF4] bg-white px-4 py-0.5">
					<div className="flex items-start justify-between gap-4 border-b border-[#EEF2F7] py-2.5">
						<p className="text-sm text-[#6D7D97]">Structure</p>
						<p className="max-w-[62%] text-right text-sm font-medium text-[#11284B]">
							{structureLabel}
						</p>
					</div>
					<div className="flex items-start justify-between gap-4 py-2.5">
						<p className="text-sm text-[#6D7D97]">Settlement</p>
						<p className="max-w-[62%] text-right text-sm font-medium text-[#11284B]">
							{settlementLabel}
						</p>
					</div>
				</div>

				<Link
					to={`/opportunities/${project.id}`}
					onClick={() => onOpen?.(project.id)}
					className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[18px] bg-[#8DC6E7] px-5 text-sm font-semibold text-[#0F2747] shadow-[0_10px_24px_rgba(141,198,231,0.35)] transition duration-200 hover:bg-[#7FBDE1] focus:outline-none focus:ring-2 focus:ring-[#8DC6E7] focus:ring-offset-2"
				>
					{ctaLabel}
				</Link>
			</div>
		</div>
	);
}
