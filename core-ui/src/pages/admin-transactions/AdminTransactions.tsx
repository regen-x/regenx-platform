import { useEffect, useState } from 'react';

import {
	AdminActionButton,
	AdminPageHeader,
	AdminSectionCard,
} from '@/components/admin-ui';
import { transactionService } from '@/services/transaction.service';

type TransactionItem = {
	id: string;
	createdAt: string;
	type: string;
	amount: number;
	currency?: string;
	tokenAmount?: number;
	status?: string;
	reference?: string;
	project?: { name?: string };
	user?: { fullName?: string; walletAddress?: string };
};

const formatAmount = (amount?: number) => {
	if (amount === undefined || amount === null || Number.isNaN(amount))
		return '—';
	return String(amount);
};

const AdminTransactions = () => {
	const [transactions, setTransactions] = useState<TransactionItem[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchTransactions = async () => {
		try {
			setLoading(true);

			const { data } = await transactionService.getTransactions({
				sortBy: 'createdAt',
			});

			const mapped: TransactionItem[] = data.map(
				({ attributes, id }, index) => ({
					id: id ?? `tx-${index}`,
					createdAt: attributes.createdAt,
					type: String(attributes.type ?? '-'),
					amount: Number(attributes.amount ?? 0),
					project: attributes.project
						? { name: attributes.project.name }
						: undefined,
					currency: attributes.currency,
					tokenAmount: attributes.tokenAmount,
					status: attributes.status,
					reference: attributes.reference,
					user: attributes.user
						? {
								fullName: attributes.user.fullName,
								walletAddress: attributes.user.walletAddress,
						  }
						: undefined,
				}),
			);

			setTransactions(mapped);
		} catch (error) {
			console.error('Failed to load transactions', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTransactions();
	}, []);

	return (
		<div className="min-h-screen bg-[#F7F8FB] px-4 py-4">
			<div className="max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Transactions"
					description="Monitor transaction activity, investor participation, and capital movement across active projects."
					actions={
						<AdminActionButton tone="primary" onClick={() => window.print()}>
							Export Transactions
						</AdminActionButton>
					}
				/>

				{loading ? (
					<div className="text-sm text-[#5F6C86]">Loading transactions...</div>
				) : transactions.length === 0 ? (
					<div className="text-sm text-[#5F6C86]">No transactions found</div>
				) : (
					<AdminSectionCard>
						<div className="overflow-x-auto">
							<table className="min-w-full border-separate border-spacing-y-3">
								<thead>
									<tr className="text-left text-sm text-[#98A2B3]">
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
											Investor
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Wallet
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Reference
										</th>
									</tr>
								</thead>
								<tbody>
									{transactions.map((tx) => (
										<tr
											key={tx.id}
											className="rounded-[18px] bg-[#FCFDFE] text-sm text-[#163F74]"
										>
											<td className="rounded-l-2xl px-3 py-4">
												{new Date(tx.createdAt).toLocaleString()}
											</td>
											<td className="px-3 py-4">{tx.type}</td>
											<td className="px-3 py-4">{tx.project?.name || '-'}</td>
											<td className="px-3 py-4">
												{formatAmount(tx.amount)} {tx.currency || 'AUD'}
											</td>
											<td className="px-3 py-4">
												{formatAmount(tx.tokenAmount)}
											</td>
											<td className="px-3 py-4">{tx.status || '-'}</td>
											<td className="px-3 py-4">{tx.user?.fullName || '-'}</td>
											<td className="px-3 py-4 text-[#5F6C86]">
												{tx.user?.walletAddress || '-'}
											</td>
											<td className="rounded-r-[18px] px-3 py-4 text-[#5F6C86]">
												{tx.reference || '-'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</AdminSectionCard>
				)}
			</div>
		</div>
	);
};

export default AdminTransactions;
