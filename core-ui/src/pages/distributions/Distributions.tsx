import { useEffect, useMemo, useState } from 'react';

import {
	AdminActionButton,
	AdminDataTableShell,
	AdminPageHeader,
	AdminStatCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import {
	IDistribution,
	IDistributionSummary,
} from '@/interfaces/api/IDistribution';
import { distributionService } from '@/services/distribution.service';

const money = (value?: number | null, currency = 'AUD') =>
	value == null || Number.isNaN(Number(value))
		? '—'
		: new Intl.NumberFormat('en-AU', {
				style: 'currency',
				currency,
				maximumFractionDigits: 2,
		  }).format(Number(value));

const percent = (value?: number | null) =>
	value == null || Number.isNaN(Number(value))
		? 'Unavailable'
		: `${Number(value).toFixed(2)}%`;

const formatDate = (value?: string | null) =>
	value ? new Date(value).toLocaleDateString() : '—';

export default function Distributions() {
	const [records, setRecords] = useState<IDistribution[]>([]);
	const [summary, setSummary] = useState<IDistributionSummary | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const [distributionRows, distributionSummary] = await Promise.all([
					distributionService.getMyDistributions(),
					distributionService.getMySummary(),
				]);

				setRecords(Array.isArray(distributionRows) ? distributionRows : []);
				setSummary(distributionSummary || null);
			} catch (error) {
				console.error('Failed to load distributions', error);
				setRecords([]);
				setSummary(null);
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, []);

	const paidThisYear = useMemo(() => {
		const currentYear = new Date().getUTCFullYear();
		return records.reduce((sum, record) => {
			if (record.status !== 'PAID' || !record.distributionDate) return sum;
			return new Date(record.distributionDate).getUTCFullYear() === currentYear
				? sum + Number(record.netAmount || 0)
				: sum;
		}, 0);
	}, [records]);

	const statusTone = (status?: string) => {
		if (status === 'PAID') return 'blue' as const;
		if (status === 'FAILED') return 'pink' as const;
		return 'yellow' as const;
	};

	return (
		<div className="theme-page-shell min-h-screen px-4 py-4">
			<div className="w-full max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Investor Portal"
					title="Distributions"
					description="Review scheduled and paid income across your project holdings, with estimated yield derived from settled investment capital."
					actions={
						<div className="flex gap-3">
							<AdminActionButton disabled>Download Statement</AdminActionButton>
							<AdminActionButton disabled tone="secondary">
								Export CSV
							</AdminActionButton>
						</div>
					}
				/>

				<div className="mb-4 grid gap-4 md:grid-cols-4">
					<AdminStatCard
						label="Total income received"
						value={money(summary?.totalIncomeReceived)}
					/>
					<AdminStatCard
						label="Pending"
						value={money(summary?.pendingIncome)}
					/>
					<AdminStatCard label="Paid this year" value={money(paidThisYear)} />
					<AdminStatCard
						label="Estimated portfolio yield"
						value={percent(summary?.currentYieldEstimate ?? null)}
						helper="Estimated from trailing income over settled invested capital."
					/>
				</div>

				<AdminDataTableShell
					title="Income Ledger"
					description="Distribution history sourced from project payout entitlements and settlement status."
					loading={loading}
					loadingLabel="Loading distributions..."
					isEmpty={records.length === 0}
					emptyTitle="No distributions recorded yet"
					emptyDescription="Scheduled and paid investor income will appear here once project distribution events are calculated and processed."
				>
					<table className="min-w-full border-separate border-spacing-y-3">
						<thead>
							<tr className="text-left text-sm theme-text-secondary">
								{[
									'Date',
									'Project',
									'Type',
									'Gross',
									'Fees',
									'Net',
									'Status',
									'Reference',
								].map((heading) => (
									<th
										key={heading}
										className="pb-2 font-medium uppercase tracking-[0.08em]"
									>
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{records.map((record) => (
								<tr key={record.id} className="theme-card text-sm theme-text">
									<td className="rounded-l-[18px] px-4 py-4">
										{formatDate(record.distributionDate || record.createdAt)}
									</td>
									<td className="px-4 py-4 font-semibold">
										{record.projectName || `Project ${record.projectId}`}
									</td>
									<td className="px-4 py-4">{record.type}</td>
									<td className="px-4 py-4">
										{money(record.grossAmount, record.currency)}
									</td>
									<td className="px-4 py-4">
										{money(record.feeAmount ?? 0, record.currency)}
									</td>
									<td className="px-4 py-4 font-semibold">
										{money(record.netAmount, record.currency)}
									</td>
									<td className="px-4 py-4">
										<AdminStatusBadge
											label={record.status}
											tone={statusTone(record.status)}
										/>
									</td>
									<td className="rounded-r-[18px] px-4 py-4 theme-text-secondary">
										{record.reference || '—'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</AdminDataTableShell>
			</div>
		</div>
	);
}
