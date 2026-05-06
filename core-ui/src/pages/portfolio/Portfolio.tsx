import { Download, Filter, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
	AdminActionButton,
	AdminDataTableShell,
	AdminFilterBar,
	AdminPageHeader,
	AdminStatCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import TokenLink from '@/components/common/TokenLink';
import { IDistributionSummary } from '@/interfaces/api/IDistribution';
import { distributionService } from '@/services/distribution.service';
import { ownershipService } from '@/services/ownership.service';
import { useUserStore } from '@/store/user.store';

type HoldingRow = {
	projectId: number;
	seriesId: number;
	projectName: string;
	tokenSymbol: string;
	assetCode?: string;
	assetIssuer?: string | null;
	issuer?: string | null;
	status?: string;
	projectStatus?: string;
	custodyType: 'self_custody' | 'regenx_custody';
	ownershipSource?: 'ON_CHAIN' | 'INTERNAL_LEDGER';
	settlementStatus?:
		| 'PENDING'
		| 'SUBMITTED'
		| 'SETTLED'
		| 'FAILED'
		| 'CANCELLED';
	totalTokens: number | string;
	totalValue: number | string;
};

function formatUnits(value: number) {
	return value.toLocaleString();
}

const money = (value?: number | null, currency = 'AUD') =>
	value == null || Number.isNaN(Number(value))
		? 'Unavailable'
		: new Intl.NumberFormat('en-AU', {
				style: 'currency',
				currency,
				maximumFractionDigits: 2,
		  }).format(Number(value));

const percent = (value?: number | null) =>
	value == null || Number.isNaN(Number(value))
		? 'Unavailable'
		: `${Number(value).toFixed(2)}%`;

const dateValue = (value?: string | null) =>
	value ? new Date(value).toLocaleDateString() : '—';

export default function Portfolio() {
	const { user } = useUserStore();
	const [page] = useState(1);
	const [rows, setRows] = useState<HoldingRow[]>([]);
	const [search, setSearch] = useState('');
	const [distributionSummary, setDistributionSummary] =
		useState<IDistributionSummary | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadHoldings = async () => {
			try {
				setLoading(true);
				const [res, summary] = await Promise.all([
					ownershipService.getMyHoldings(),
					distributionService.getMySummary(),
				]);
				const data = (res as any)?.data ?? res ?? [];
				setRows(Array.isArray(data) ? data : []);
				setDistributionSummary(summary || null);
			} catch (error) {
				console.error('Failed to load portfolio holdings', error);
				setRows([]);
				setDistributionSummary(null);
			} finally {
				setLoading(false);
			}
		};

		loadHoldings();
	}, []);

	const holdings = useMemo(() => {
		return rows.map((row, index) => {
			const totalTokens = Number(row.totalTokens || 0);
			const projectSummary = distributionSummary?.byProject?.find(
				(item) => Number(item.projectId) === Number(row.projectId),
			);

			return {
				id: `${row.projectId}-${row.seriesId}-${row.tokenSymbol}-${index}`,
				project: row.projectName || `Project ${row.projectId}`,
				token: row.assetCode || row.tokenSymbol || 'TOKEN',
				issuer: row.assetIssuer || row.issuer || null,
				status: row.projectStatus || row.status || null,
				unitsHeld: totalTokens,
				custodyType: row.custodyType,
				totalIncomeReceived: projectSummary?.totalIncomeReceived ?? 0,
				latestDistributionDate: projectSummary?.latestDistributionDate ?? null,
				estimatedYield: projectSummary?.estimatedYield ?? null,
			};
		});
	}, [distributionSummary?.byProject, rows]);

	const visibleHoldings = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return holdings;

		return holdings.filter((holding) =>
			`${holding.project} ${holding.token}`.toLowerCase().includes(query),
		);
	}, [holdings, search]);

	const displayName = user?.fullName || 'Institutional Portfolio';

	return (
		<div
			className="theme-page-shell min-h-full w-full px-4 py-4"
			data-test="investor-portfolio"
		>
			<div className="w-full max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Investor Portal"
					title="Institutional Portfolio"
					description="Review settled holdings, income received, and estimated yield across your live project positions."
					actions={
						<div className="flex items-center gap-3">
							<div className="rounded-[14px] border theme-border theme-card px-4 py-3 text-right">
								<div className="text-[14px] font-semibold theme-heading">
									{displayName}
								</div>
								<div className="text-[11px] uppercase tracking-[0.08em] theme-text-secondary">
									Investor
								</div>
							</div>
							<AdminActionButton disabled>Export Portfolio</AdminActionButton>
						</div>
					}
				/>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					<AdminStatCard
						label="Estimated Portfolio Value"
						value={money(distributionSummary?.portfolioEstimatedValue ?? null)}
						helper="Estimated from current token prices"
					/>
					<AdminStatCard
						label="Income Received"
						value={money(distributionSummary?.totalIncomeReceived ?? 0)}
						helper="Net paid distributions across holdings"
					/>
					<AdminStatCard
						label="Average Yield"
						value={percent(
							distributionSummary?.averageYieldAcrossHoldings ?? null,
						)}
						helper="Estimated from trailing income over invested capital"
					/>
				</div>

				<AdminDataTableShell
					title="My Holdings"
					description="Settled positions with linked distribution history and estimated yield by project."
					className="mt-3"
					filters={
						<AdminFilterBar>
							<div className="relative min-w-0 flex-1 max-w-[360px]">
								<Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-secondary" />
								<input
									type="text"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search holdings..."
									className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card pl-11 pr-4 theme-text outline-none placeholder:text-[#9AA7BC]"
								/>
							</div>
							<div className="flex items-center gap-2">
								<AdminActionButton disabled>
									<Filter className="mr-2 inline h-3.5 w-3.5" />
									Filter
								</AdminActionButton>
								<AdminActionButton disabled tone="secondary">
									<Download className="mr-2 inline h-3.5 w-3.5" />
									Export
								</AdminActionButton>
							</div>
						</AdminFilterBar>
					}
					loading={loading}
					loadingLabel="Loading portfolio holdings..."
					isEmpty={visibleHoldings.length === 0}
					emptyTitle="No holdings found yet"
					emptyDescription="Live investor positions will appear here once your orders settle and token holdings are recorded."
				>
					<table className="min-w-full border-separate border-spacing-y-3">
						<thead>
							<tr className="text-left text-sm theme-text-secondary">
								{[
									'Project',
									'Token',
									'Units Held',
									'Income Received',
									'Latest Distribution',
									'Est. Yield',
									'Custody',
								].map((heading) => (
									<th
										key={heading}
										className="pb-2 px-4 font-medium uppercase tracking-[0.08em]"
									>
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{visibleHoldings.map((holding) => (
								<tr key={holding.id} className="theme-card text-sm theme-text">
									<td className="rounded-l-[18px] px-4 py-4 font-semibold">
										{holding.project}
									</td>
									<td className="px-4 py-4">
										<span className="rounded-[8px] bg-[#EAF2FF] px-3 py-1.5 text-[12px] font-semibold text-[#2F5EA8]">
											<TokenLink
												assetCode={holding.token}
												assetIssuer={holding.issuer}
												status={holding.status}
												className="hover:underline"
											>
												{holding.token}
											</TokenLink>
										</span>
									</td>
									<td className="px-4 py-4 font-medium">
										{formatUnits(holding.unitsHeld)}
									</td>
									<td className="px-4 py-4 font-medium">
										{money(holding.totalIncomeReceived)}
									</td>
									<td className="px-4 py-4 font-medium">
										{dateValue(holding.latestDistributionDate)}
									</td>
									<td className="px-4 py-4 font-medium">
										{percent(holding.estimatedYield)}
									</td>
									<td className="rounded-r-[18px] px-4 py-4">
										<AdminStatusBadge label="Platform Managed" tone="gray" />
									</td>
								</tr>
							))}
						</tbody>
					</table>

					<div className="mt-5 flex items-center justify-between border-t theme-border px-1 pt-4">
						<div className="text-[13px] theme-text-secondary">
							Showing {visibleHoldings.length} holdings
						</div>
						<div className="text-[13px] theme-text-secondary">Page {page}</div>
					</div>
				</AdminDataTableShell>
			</div>
		</div>
	);
}
