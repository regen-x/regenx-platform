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
import { IProject } from '@/interfaces/api/IProject';
import { ITransaction } from '@/interfaces/api/ITransaction';
import { projectService } from '@/services/project.service';
import { transactionService } from '@/services/transaction.service';

const money = (value?: number | null, currency = 'AUD') =>
	value == null || Number.isNaN(Number(value))
		? '—'
		: new Intl.NumberFormat('en-AU', {
				style: 'currency',
				currency,
				maximumFractionDigits: 2,
		  }).format(Number(value));

export default function DevTransactions() {
	const [searchParams] = useSearchParams();
	const [projects, setProjects] = useState<IProject[]>([]);
	const [transactions, setTransactions] = useState<ITransaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [projectUuid, setProjectUuid] = useState('');

	useEffect(() => {
		const loadProjects = async () => {
			const response = await projectService.getMyProjects();
			const mapped = response.data.map(({ attributes, id }: any) => ({
				...attributes,
				id,
			}));
			setProjects(mapped);

			const requestedProjectUuid = searchParams.get('projectUuid');
			if (requestedProjectUuid) {
				const matchedProject = mapped.find(
					(project: IProject) => project.uuid === requestedProjectUuid,
				);
				if (matchedProject?.uuid) {
					setProjectUuid(matchedProject.uuid);
				}
			}
		};

		void loadProjects();
	}, [searchParams]);

	useEffect(() => {
		const loadTransactions = async () => {
			try {
				setLoading(true);
				const { data } = await transactionService.getDeveloperTransactions({
					projectUuid: projectUuid || undefined,
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

		void loadTransactions();
	}, [projectUuid]);

	const totals = useMemo(
		() =>
			transactions.reduce(
				(acc, tx) => {
					if (tx.type === TransactionType.BUY)
						acc.inflows += Number(tx.amount || 0);
					if (tx.type === TransactionType.FEE)
						acc.fees += Number(tx.amount || 0);
					if (tx.type === TransactionType.DISTRIBUTION)
						acc.distributions += Number(tx.amount || 0);
					return acc;
				},
				{ inflows: 0, fees: 0, distributions: 0 },
			),
		[transactions],
	);

	return (
		<AppPageShell>
			<div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0 flex-1">
					<AppPageHeader
						eyebrow="Climate Developer Portal"
						title="Transactions"
						description="Review capital inflows, fees, and future-ready distribution events across your projects."
					/>
				</div>
				<div className="flex shrink-0 gap-3">
					<AdminActionButton disabled>Export CSV</AdminActionButton>
					<AdminActionButton disabled tone="secondary">
						Distribution Tracking
					</AdminActionButton>
				</div>
			</div>

			<div className="mb-4 grid gap-4 md:grid-cols-3">
				<AdminStatCard label="Capital inflows" value={money(totals.inflows)} />
				<AdminStatCard label="Fees" value={money(totals.fees)} />
				<AdminStatCard
					label="Distributions"
					value={money(totals.distributions)}
				/>
			</div>

			<AdminDataTableShell
				title="Project ledger"
				description="Developer-visible money movement tied to your projects."
				filters={
					<AdminFilterBar>
						<div className="max-w-sm flex-1">
							<select
								value={projectUuid}
								onChange={(event) => setProjectUuid(event.target.value)}
								className="min-h-[50px] w-full rounded-[14px] border theme-border theme-card px-4 py-3 theme-text"
							>
								<option value="">All projects</option>
								{projects.map((project) => (
									<option key={project.id} value={project.uuid}>
										{project.name}
									</option>
								))}
							</select>
						</div>
					</AdminFilterBar>
				}
				loading={loading}
				loadingLabel="Loading transactions..."
				isEmpty={!transactions.length}
				emptyTitle="No project transactions yet"
				emptyDescription="Capital inflows, fee movements, and future distribution activity will appear here once your projects begin transacting."
			>
				<table className="min-w-full border-separate border-spacing-y-3">
					<thead>
						<tr className="text-left text-sm theme-text-secondary">
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Date
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Project
							</th>
							<th className="pb-2 font-medium uppercase tracking-[0.08em]">
								Type
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
						{transactions.map((tx) => (
							<tr key={tx.id} className="theme-card text-sm theme-text">
								<td className="rounded-l-[18px] px-4 py-4">
									{new Date(tx.createdAt).toLocaleString()}
								</td>
								<td className="px-4 py-4">{tx.project?.name || '—'}</td>
								<td className="px-4 py-4">
									{TransactionTypeLabels[tx.type] || tx.type}
								</td>
								<td className="px-4 py-4 font-semibold">
									{money(tx.amount, tx.currency || 'AUD')}
								</td>
								<td className="px-4 py-4">{tx.tokenAmount ?? '—'}</td>
								<td className="px-4 py-4">
									<AdminStatusBadge
										label={TransactionStatusLabels[tx.status] || tx.status}
										tone={
											tx.status === 'FAILED'
												? 'pink'
												: tx.status === 'COMPLETED'
												? 'blue'
												: 'yellow'
										}
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
