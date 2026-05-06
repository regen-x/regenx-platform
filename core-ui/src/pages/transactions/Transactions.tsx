import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	AdminActionButton,
	AdminDataTableShell,
	AdminFilterBar,
	AdminStatCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import AppPageHeader from '@/components/layout/AppPageHeader';
import AppPageShell from '@/components/layout/AppPageShell';
import {
	TransactionStatusLabels,
	TransactionType,
	TransactionTypeLabels,
} from '@/constants/enum/transaction-type.enum';
import { ITransaction } from '@/interfaces/api/ITransaction';
import { transactionService } from '@/services/transaction.service';

const money = (value?: number | null, currency = 'AUD') =>
	value == null || Number.isNaN(Number(value))
		? '—'
		: new Intl.NumberFormat('en-AU', {
				style: 'currency',
				currency,
				maximumFractionDigits: 2,
		  }).format(Number(value));

const formatTokenAmount = (value?: number | null) =>
	value == null || Number.isNaN(Number(value))
		? '—'
		: Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function Transactions() {
	const [searchParams] = useSearchParams();
	const [transactions, setTransactions] = useState<ITransaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [type, setType] = useState<string>('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const referenceFilter = searchParams.get('reference') || '';

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const { data } = await transactionService.getMyTransactions({
					type: type ? (type as TransactionType) : undefined,
					dateFrom: dateFrom || undefined,
					dateTo: dateTo || undefined,
					sortBy: 'createdAt',
				});

				setTransactions(
					data.map(({ attributes, id }) => ({
						...attributes,
						id,
					})),
				);
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [type, dateFrom, dateTo]);

	const totals = useMemo(
		() =>
			transactions.reduce(
				(acc, tx) => {
					if (tx.type === TransactionType.BUY) {
						acc.buy += Number(tx.amount || 0);
					}
					if (tx.type === TransactionType.DEPOSIT) {
						acc.deposit += Number(tx.amount || 0);
					}
					return acc;
				},
				{ buy: 0, deposit: 0 },
			),
		[transactions],
	);

	const visibleTransactions = useMemo(() => {
		if (!referenceFilter) return transactions;
		return transactions.filter((tx) =>
			String(tx.reference || '')
				.toLowerCase()
				.includes(referenceFilter.toLowerCase()),
		);
	}, [referenceFilter, transactions]);

	const statusTone = (status?: string) => {
		if (status === 'COMPLETED') return 'blue' as const;
		if (status === 'FAILED') return 'pink' as const;
		return 'yellow' as const;
	};

	return (
		<AppPageShell>
			<div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0 flex-1">
					<AppPageHeader
						eyebrow="Investor Portal"
						title="Transactions"
						description="Track every recorded cash and token movement tied to your RegenX account."
					/>
				</div>
				<div className="flex shrink-0 gap-3">
					<AdminActionButton disabled>Export CSV</AdminActionButton>
					<AdminActionButton disabled tone="secondary">
						Tax Reporting
					</AdminActionButton>
				</div>
			</div>

			<div className="mb-4 grid gap-4 md:grid-cols-3">
				<AdminStatCard label="Buy volume" value={money(totals.buy)} />
				<AdminStatCard label="Deposits logged" value={money(totals.deposit)} />
				<AdminStatCard label="Entries" value={transactions.length} />
			</div>

			<AdminDataTableShell
				title="Ledger"
				description="Investor-side transaction history backed by the platform transaction ledger."
				filters={
					<>
						<AdminFilterBar>
							<div className="grid flex-1 gap-3 md:grid-cols-4">
								<select
									value={type}
									onChange={(event) => setType(event.target.value)}
									className="min-h-[50px] rounded-[14px] border theme-border theme-card px-4 py-3 theme-text"
								>
									<option value="">All types</option>
									{Object.values(TransactionType).map((value) => (
										<option key={value} value={value}>
											{TransactionTypeLabels[value]}
										</option>
									))}
								</select>
								<input
									type="date"
									value={dateFrom}
									onChange={(event) => setDateFrom(event.target.value)}
									className="min-h-[50px] rounded-[14px] border theme-border theme-card px-4 py-3 theme-text"
								/>
								<input
									type="date"
									value={dateTo}
									onChange={(event) => setDateTo(event.target.value)}
									className="min-h-[50px] rounded-[14px] border theme-border theme-card px-4 py-3 theme-text"
								/>
							</div>
						</AdminFilterBar>

						{referenceFilter ? (
							<div className="mb-4 rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-[13px] text-[#5F6C86] shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
								Filtered to reference:{' '}
								<span className="font-semibold text-[#163F74]">
									{referenceFilter}
								</span>
							</div>
						) : null}
					</>
				}
				loading={loading}
				loadingLabel="Loading transactions..."
				isEmpty={!visibleTransactions.length}
				emptyTitle="No transactions recorded yet"
				emptyDescription="Cash movements, token settlements, and completed ledger entries will appear here once your account activity begins."
			>
				<table className="min-w-full border-separate border-spacing-y-3">
					<thead>
						<tr className="text-left text-sm theme-text-secondary">
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Date
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Type
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Project
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Amount
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Token amount
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Status
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Reference
							</th>
						</tr>
					</thead>
					<tbody>
						{visibleTransactions.map((tx) => (
							<tr key={tx.id} className="theme-card text-sm theme-text">
								<td className="rounded-l-[18px] px-4 py-4">
									{new Date(tx.createdAt).toLocaleString()}
								</td>
								<td className="px-4 py-4">
									{TransactionTypeLabels[tx.type] || tx.type}
								</td>
								<td className="px-4 py-4">{tx.project?.name || '—'}</td>
								<td className="px-4 py-4 font-semibold">
									{money(tx.amount, tx.currency || 'AUD')}
								</td>
								<td className="px-4 py-4">
									{formatTokenAmount(tx.tokenAmount)}
								</td>
								<td className="px-4 py-4">
									<AdminStatusBadge
										label={TransactionStatusLabels[tx.status] || tx.status}
										tone={statusTone(tx.status)}
									/>
								</td>
								<td className="rounded-r-[18px] px-4 py-4 theme-text-secondary">
									{tx.reference || '—'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</AdminDataTableShell>
		</AppPageShell>
	);
}
