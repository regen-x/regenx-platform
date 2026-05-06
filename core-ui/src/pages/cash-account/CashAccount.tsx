import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { AdminActionButton } from '@/components/admin-ui';
import AppPageHeader from '@/components/layout/AppPageHeader';
import AppPageShell from '@/components/layout/AppPageShell';
import TransferModal from '@/components/modals/TransferModal';
import { TransactionTypeLabels } from '@/constants/enum/transaction-type.enum';
import useUserTypeLabel from '@/hooks/common/useUserTypeLabel';
import { ITransaction } from '@/interfaces/api/ITransaction';
import { transactionService } from '@/services/transaction.service';
import { setOnboarding, useUserStore } from '@/store/user.store';

function formatMoney(value?: number | null, currency = 'AUD') {
	if (value == null || Number.isNaN(Number(value))) return 'Unavailable';

	return new Intl.NumberFormat('en-AU', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(Number(value));
}

export default function CashAccount() {
	const { user, onboarding } = useUserStore();
	const [showTransferModal, setShowTransferModal] = useState(false);
	const [transferMode, setTransferMode] = useState<'deposit' | 'withdraw'>(
		'deposit',
	);
	const { userTypeLabel } = useUserTypeLabel({ userType: user?.type });
	const [recentTransactions, setRecentTransactions] = useState<ITransaction[]>(
		[],
	);
	const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
	const [showBankForm, setShowBankForm] = useState(false);
	const [bankForm, setBankForm] = useState({
		bankAccountName: onboarding?.bankAccountName || '',
		bankName: onboarding?.bankName || '',
		bsb: onboarding?.bsb || '',
		accountNumber: onboarding?.accountNumber || '',
	});

	const onBankInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setBankForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSaveBank = () => {
		const bankAccountVerified = Boolean(
			bankForm.bankAccountName.trim() &&
				bankForm.bankName.trim() &&
				bankForm.bsb.trim() &&
				bankForm.accountNumber.trim(),
		);

		setOnboarding({
			bankAccountVerified,
			bankAccountName: bankForm.bankAccountName,
			bankName: bankForm.bankName,
			bsb: bankForm.bsb,
			accountNumber: bankForm.accountNumber,
		});

		setShowBankForm(false);
	};

	const handleGetRecentTransactions = useCallback(async () => {
		try {
			setIsTransactionsLoading(true);

			const { data: transactionsResponse } =
				await transactionService.getMyTransactions({
					sortBy: 'createdAt',
				});

			const transactionsData = transactionsResponse
				.map(({ attributes, id }) => ({
					...attributes,
					id,
				}))
				.slice(0, 10);

			setRecentTransactions(transactionsData);
		} catch (error) {
			console.error(error);
			setRecentTransactions([]);
		} finally {
			setIsTransactionsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (user?.id) {
			void handleGetRecentTransactions();
		} else {
			setRecentTransactions([]);
		}
	}, [handleGetRecentTransactions, user?.id]);

	const bankAccountName =
		onboarding?.bankAccountName || user?.fullName || 'Account Holder';
	const bankName = onboarding?.bankName || 'Add your bank';
	const bsb = onboarding?.bsb || '—';
	const accountNumberMasked = onboarding?.accountNumber
		? `•••• ${onboarding.accountNumber.slice(-4)}`
		: '•••• ----';
	const hasBankAccount = Boolean(
		onboarding?.bankAccountName &&
			onboarding?.bankName &&
			onboarding?.bsb &&
			onboarding?.accountNumber,
	);

	const canExportTransactions = recentTransactions.length > 0;

	const handleExportTransactions = () => {
		if (!recentTransactions.length) return;

		const rows = recentTransactions.map((transaction) => {
			return {
				date: new Date(transaction.createdAt).toISOString(),
				type:
					TransactionTypeLabels[
						String(
							transaction.type,
						).toUpperCase() as keyof typeof TransactionTypeLabels
					] || transaction.type,
				project: transaction.project?.name || '',
				amountAud: Number(transaction.amount ?? 0).toFixed(2),
			};
		});

		const header = ['Date', 'Type', 'Project', 'Amount (AUD)'];
		const csv = [
			header.join(','),
			...rows.map((row) =>
				[row.date, `"${row.type}"`, `"${row.project}"`, row.amountAud].join(
					',',
				),
			),
		].join('\n');

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'cash-account-transactions.csv';
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<AppPageShell className="mb-4" data-test="cash-account">
			<AppPageHeader
				eyebrow={userTypeLabel || 'RegenX Portal'}
				title="Cash Account"
				description="Manage fiat balances, settlement details, and account readiness."
			/>

			<div
				className="mb-4 flex w-full flex-wrap gap-3"
				data-test="cash-account-options"
			>
				<AdminActionButton
					onClick={() => {
						setTransferMode('withdraw');
						setShowTransferModal(true);
					}}
				>
					Withdraw
				</AdminActionButton>

				<AdminActionButton
					onClick={() => {
						setTransferMode('deposit');
						setShowTransferModal(true);
					}}
				>
					Deposit
				</AdminActionButton>

				<AdminActionButton
					onClick={() => setShowBankForm(true)}
					tone="secondary"
				>
					Add Bank Account
				</AdminActionButton>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
				<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
						Fiat Settlement
					</div>
					<div className="mt-3 text-sm text-[#5F6C86]">Cash Balance</div>
					<div className="mt-1 text-[30px] font-semibold tracking-tight text-[#163F74]">
						{formatMoney(0)}
					</div>
					<div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Bank Account
							</div>
							<div className="mt-2 text-[16px] font-semibold text-[#163F74]">
								{bankAccountName}
							</div>
							<div className="mt-1 text-sm text-[#5F6C86]">{bankName}</div>
						</div>
						<div className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Settlement Status
							</div>
							<div className="mt-2 text-[16px] font-semibold text-[#163F74]">
								{hasBankAccount ? 'Ready' : 'Bank details required'}
							</div>
							<div className="mt-1 text-sm text-[#5F6C86]">
								BSB {bsb} • {accountNumberMasked}
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
						Custody
					</div>
					<div className="mt-3 text-sm text-[#5F6C86]">Managed by RegenX</div>
					<div className="mt-1 text-lg font-semibold text-[#163F74]">
						Platform-managed custody and settlement
					</div>

					<div className="mt-4 border-t border-[#E7ECF4] pt-4">
						<div className="text-sm text-[#5F6C86]">Ownership records</div>
						<div className="mt-1 text-xl font-semibold text-[#163F74]">
							Maintained through the platform
						</div>
					</div>

					<div className="mt-4 border-t border-[#E7ECF4] pt-4">
						<div className="text-sm text-[#5F6C86]">Investor experience</div>
						<div className="mt-1 text-sm leading-[1.7] text-[#163F74]">
							No wallet setup is required in the standard investment flow.
							RegenX manages custody operations and settlement readiness behind
							the scenes.
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 w-full rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex-1">
						<div className="mb-4 flex items-center justify-between gap-4">
							<div>
								<h2 className="text-lg font-semibold text-[#163F74]">
									Bank Account
								</h2>
								<p className="text-sm text-[#5F6C86]">
									Linked fiat settlement account
								</p>
							</div>

							<span className="text-sm font-medium text-[#16588F]">
								{hasBankAccount ? 'Added' : 'Not Added'}
							</span>
						</div>

						<div className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Account Name
								</p>
								<p className="font-semibold text-[#163F74]">
									{bankAccountName}
								</p>
							</div>

							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Bank Name
								</p>
								<p className="font-semibold text-[#163F74]">{bankName}</p>
							</div>

							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									BSB
								</p>
								<p className="font-semibold text-[#163F74]">{bsb}</p>
							</div>

							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Account Number
								</p>
								<p className="font-semibold text-[#163F74]">
									{accountNumberMasked}
								</p>
							</div>
						</div>
					</div>

					<div className="w-full shrink-0 lg:w-[340px]">
						<div className="relative overflow-hidden rounded-[24px] border border-[#4D6DE0] bg-[linear-gradient(135deg,#2946C9_0%,#4F6FE5_58%,#6D86F0_100%)] p-3.5 shadow-[0_16px_40px_rgba(31,61,166,0.28)]">
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_32%)]" />
							<div className="absolute inset-[1px] rounded-[23px] border border-[rgba(255,255,255,0.14)]" />

							<div className="relative flex min-h-[94px] flex-col justify-between text-white">
								<div>
									<div className="flex items-start justify-between gap-4">
										<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(232,239,255,0.86)]">
											Settlement Account
										</p>
										<div className="text-right">
											<div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[rgba(232,239,255,0.92)]">
												Platform
											</div>
										</div>
									</div>

									<div className="mt-3 flex items-center justify-between">
										<div className="grid h-[30px] w-[42px] grid-cols-3 overflow-hidden rounded-[8px] border border-[rgba(20,36,92,0.35)] bg-[linear-gradient(135deg,#FFD44D_0%,#FFB829_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
											<div className="border-r border-b border-[rgba(20,36,92,0.35)]" />
											<div className="border-r border-b border-[rgba(20,36,92,0.35)]" />
											<div className="border-b border-[rgba(20,36,92,0.35)]" />
											<div className="border-r border-b border-[rgba(20,36,92,0.35)]" />
											<div className="border-r border-[rgba(20,36,92,0.35)]" />
											<div className="border-b border-[rgba(20,36,92,0.35)]" />
											<div className="border-r border-[rgba(20,36,92,0.35)]" />
											<div className="border-r border-[rgba(20,36,92,0.35)]" />
											<div />
										</div>

										<div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.9)]">
											<div className="h-2.5 w-1 rounded-full bg-current" />
											<div className="h-4 w-1 rounded-full bg-current" />
											<div className="h-2.5 w-1 rounded-full bg-current" />
										</div>
									</div>

									<div className="mt-3 text-[13px] font-medium tracking-[0.16em] text-[rgba(255,255,255,0.96)]">
										{accountNumberMasked}
									</div>

									<div className="mt-3 flex items-end justify-between gap-4">
										<div>
											<div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(220,231,255,0.72)]">
												Account Name
											</div>
											<div className="mt-1 text-[14px] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
												{bankAccountName}
											</div>
										</div>

										<div className="relative h-6 w-9 shrink-0">
											<div className="absolute right-3 top-0 h-6 w-6 rounded-full bg-[rgba(255,255,255,0.92)]" />
											<div className="absolute right-0 top-0 h-6 w-6 rounded-full bg-[rgba(255,255,255,0.72)]" />
										</div>
									</div>
								</div>

								<div className="mt-3 flex items-end justify-between gap-6 border-t border-[rgba(255,255,255,0.14)] pt-2.5">
									<div>
										<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(220,231,255,0.72)]">
											Status
										</p>
										<p className="mt-1 text-[13px] font-medium text-white">
											{hasBankAccount ? 'Ready' : 'Pending'}
										</p>
									</div>

									<div className="text-right">
										<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(220,231,255,0.72)]">
											Mode
										</p>
										<p className="mt-1 text-[13px] font-medium text-white">
											Platform custody
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{showBankForm ? (
				<div className="mt-4 w-full rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="mb-5 flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-[#163F74]">
								Add Bank Account
							</h2>
							<p className="text-sm text-[#5F6C86]">
								Link your fiat settlement account
							</p>
						</div>

						<button
							type="button"
							onClick={() => setShowBankForm(false)}
							className="text-[#5F6C86]"
						>
							Close
						</button>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Account Name
							</label>
							<input
								name="bankAccountName"
								value={bankForm.bankAccountName}
								onChange={onBankInputChange}
								className="w-full rounded-[18px] border border-[#E7ECF4] px-4 py-3 text-[#163F74] outline-none"
							/>
						</div>

						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Bank Name
							</label>
							<input
								name="bankName"
								value={bankForm.bankName}
								onChange={onBankInputChange}
								className="w-full rounded-[18px] border border-[#E7ECF4] px-4 py-3 text-[#163F74] outline-none"
							/>
						</div>

						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								BSB
							</label>
							<input
								name="bsb"
								value={bankForm.bsb}
								onChange={onBankInputChange}
								className="w-full rounded-[18px] border border-[#E7ECF4] px-4 py-3 text-[#163F74] outline-none"
							/>
						</div>

						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Account Number
							</label>
							<input
								name="accountNumber"
								value={bankForm.accountNumber}
								onChange={onBankInputChange}
								className="w-full rounded-[18px] border border-[#E7ECF4] px-4 py-3 text-[#163F74] outline-none"
							/>
						</div>
					</div>

					<div className="mt-5 flex gap-3">
						<button
							type="button"
							onClick={handleSaveBank}
							className="rounded-[18px] bg-[#8DC6E7] px-5 py-3 font-medium text-[#0F2747]"
						>
							Save Bank Account
						</button>

						<button
							type="button"
							onClick={() => setShowBankForm(false)}
							className="rounded-[18px] border border-[#E7ECF4] bg-white px-5 py-3 font-medium text-[#163F74] shadow-[0_2px_8px_rgba(16,24,40,0.03)]"
						>
							Cancel
						</button>
					</div>
				</div>
			) : null}

			<div className="w-full rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-[#163F74]">
							Recent transactions
						</h2>
						<p className="mt-1 text-sm text-[#5F6C86]">
							Recent platform settlement activity and investment cash movements
						</p>
					</div>

					{canExportTransactions ? (
						<button
							type="button"
							onClick={handleExportTransactions}
							className="text-sm font-medium text-[#16588F]"
						>
							Export CSV
						</button>
					) : null}
				</div>

				{isTransactionsLoading ? (
					<div className="text-[#5F6C86]">Loading transactions...</div>
				) : !recentTransactions.length ? (
					<div className="text-[#5F6C86]">No transactions yet</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left">
							<thead>
								<tr className="border-b text-[#8FA0B8]">
									<th className="py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
										Date
									</th>
									<th className="py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
										Type
									</th>
									<th className="py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
										Project
									</th>
									<th className="py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
										Amount
									</th>
								</tr>
							</thead>
							<tbody>
								{recentTransactions.map((transaction) => {
									const transactionTypeLabel =
										TransactionTypeLabels[
											String(
												transaction.type,
											).toUpperCase() as keyof typeof TransactionTypeLabels
										] || transaction.type;

									return (
										<tr
											key={transaction.id}
											className="border-b border-[#EEF1F7] last:border-b-0"
										>
											<td className="py-3 text-sm text-[#5F6C86]">
												{new Date(transaction.createdAt).toLocaleString()}
											</td>
											<td className="py-3 text-sm font-medium text-[#163F74]">
												{transactionTypeLabel}
											</td>
											<td className="py-3 text-sm text-[#163F74]">
												{transaction.project?.name ?? '-'}
											</td>
											<td className="py-3 text-sm font-semibold text-[#163F74]">
												{formatMoney(Number(transaction.amount ?? 0))}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<TransferModal
				isOpen={showTransferModal}
				mode={transferMode}
				onSubmitted={() => {
					void handleGetRecentTransactions();
				}}
				onClose={() => setShowTransferModal(false)}
			/>
		</AppPageShell>
	);
}
