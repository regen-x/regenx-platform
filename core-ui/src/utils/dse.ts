export type DseType = 'Development' | 'Construction' | 'Operating';

export function toNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeDseType(value?: unknown): DseType {
	const raw = String(value || '')
		.trim()
		.toLowerCase();

	if (raw.includes('operating')) return 'Operating';
	if (raw.includes('construction')) return 'Construction';
	if (raw.includes('development')) return 'Development';

	return 'Development';
}

export function getDseBannerClasses(dseType: DseType) {
	switch (dseType) {
		case 'Operating':
			return 'bg-emerald-50 text-emerald-700 border-emerald-200';
		case 'Construction':
			return 'bg-amber-50 text-amber-700 border-amber-200';
		case 'Development':
		default:
			return 'bg-slate-100 text-slate-700 border-slate-200';
	}
}

export function getDseSummary(dseType: DseType) {
	switch (dseType) {
		case 'Operating':
			return 'Revenue-generating asset with active cashflow profile.';
		case 'Construction':
			return 'Committed project in build phase with staged capital deployment.';
		case 'Development':
		default:
			return 'Early stage project progressing toward financial close.';
	}
}

export function getDseMeaning(dseType: DseType) {
	switch (dseType) {
		case 'Operating':
			return 'Asset is built, connected, and generating revenue.';
		case 'Construction':
			return 'Project has reached financial close and is being built, moving toward operational status.';
		case 'Development':
		default:
			return 'Project is being planned and structured, progressing toward financial close.';
	}
}

export function getDseWhyFundingNeeded(dseType: DseType) {
	switch (dseType) {
		case 'Operating':
			return 'Capital is used to access existing cashflowing assets, refinance capital, or optimise capital structure.';
		case 'Construction':
			return 'Although the project has reached financial close, capital is deployed progressively to fund construction milestones through to completion.';
		case 'Development':
		default:
			return 'Capital is used to advance feasibility, approvals, grid connection, and revenue structuring toward a fully funded construction phase.';
	}
}

export function formatCurrency(value: unknown) {
	const amount = toNumber(value);
	if (!amount) return '—';
	return `$${amount.toLocaleString()}`;
}

export function formatPercent(value: unknown) {
	const amount = toNumber(value);
	if (!amount) return '—';
	return `${amount}%`;
}

export function formatTermYears(value: unknown) {
	const amount = toNumber(value);
	if (!amount) return '—';
	return `${amount} yrs`;
}

export function formatPlain(value: unknown) {
	const text = String(value || '').trim();
	return text || '—';
}
