import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import { notificationService } from '@/services/notification.service';
import { transactionService } from '@/services/transaction.service';

type TransferMode = 'deposit' | 'withdraw';
type TransferMethod = 'bank' | 'digital';

type Props = {
	isOpen: boolean;
	mode: TransferMode;
	onClose: () => void;
	onSubmitted?: () => void;
};

export default function TransferModal({
	isOpen,
	mode,
	onClose,
	onSubmitted,
}: Props) {
	const [method, setMethod] = useState<TransferMethod>('bank');
	const [amount, setAmount] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setMethod('bank');
			setAmount('');
		}
	}, [isOpen, mode]);

	if (!isOpen) return null;

	const title = mode === 'deposit' ? 'Fund Investment' : 'Request Withdrawal';
	const subtitle =
		mode === 'deposit'
			? 'Transfer funds to the SPV account or settle digitally via Stellar.'
			: 'Submit a withdrawal request via bank transfer or digital settlement.';

	const primaryLabel =
		mode === 'deposit'
			? method === 'bank'
				? "I've Sent Funds"
				: 'Continue'
			: method === 'bank'
			? 'Request Withdrawal'
			: 'Continue';

	const handleSubmit = async () => {
		const parsedAmount = Number(amount);

		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || isSubmitting) {
			notificationService.error('Enter a valid amount');
			return;
		}

		try {
			setIsSubmitting(true);
			await transactionService.createCashRequest({
				type: mode === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
				amount: parsedAmount,
				currency: method === 'digital' ? 'AUDD' : 'AUD',
				description:
					mode === 'deposit'
						? `Cash account deposit request via ${method}`
						: `Cash account withdrawal request via ${method}`,
			});
			notificationService.success(
				mode === 'deposit'
					? 'Deposit request recorded'
					: 'Withdrawal request recorded',
			);
			onSubmitted?.();
			onClose();
		} catch (error) {
			console.error(error);
			notificationService.error('Failed to record cash account request');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
			<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
				<div className="mb-6">
					<h2 className="text-xl font-semibold text-[#0F172A]">{title}</h2>
					<p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
				</div>

				<div className="mb-6 flex gap-2">
					<button
						type="button"
						onClick={() => setMethod('bank')}
						className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${
							method === 'bank'
								? 'bg-[#5B84F1] text-white'
								: 'bg-[#F1F5F9] text-[#334155]'
						}`}
					>
						Bank Transfer
					</button>

					<button
						type="button"
						onClick={() => setMethod('digital')}
						className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${
							method === 'digital'
								? 'bg-[#5B84F1] text-white'
								: 'bg-[#F1F5F9] text-[#334155]'
						}`}
					>
						Digital (AUDD)
					</button>
				</div>

				{method === 'bank' ? (
					<div className="space-y-4 text-sm">
						<div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
							<p className="mb-2 font-medium text-[#0F172A]">
								{mode === 'deposit'
									? 'SPV Bank Details'
									: 'Withdrawal Destination'}
							</p>

							<div className="space-y-1 text-[#475569]">
								<p>Account Name: RegenX SPV Pty Ltd</p>
								<p>BSB: 123-456</p>
								<p>Account Number: 12345678</p>
								<p>Reference: RX-INV-001</p>
							</div>
						</div>

						<div>
							<label className="text-xs text-[#64748B]">Amount (AUD)</label>
							<input
								type="number"
								className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
								placeholder="Enter amount"
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
							/>
						</div>

						<p className="text-xs text-[#64748B]">
							{mode === 'deposit'
								? 'Bank transfers are processed via the nominated SPV account and reconciled with your reference.'
								: 'Withdrawal requests are routed through the nominated settlement process.'}
						</p>

						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : primaryLabel}
						</Button>
					</div>
				) : (
					<div className="space-y-4 text-sm">
						<div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
							<p className="mb-2 font-medium text-[#0F172A]">
								Settlement Details
							</p>

							<div className="space-y-1 text-[#475569]">
								<p>Asset: AUDD</p>
								<p>Network: Stellar</p>
								<p>Address: GXXXXXXX...</p>
							</div>
						</div>

						<div>
							<label className="text-xs text-[#64748B]">Amount</label>
							<input
								type="number"
								className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
								placeholder="Enter amount"
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
							/>
						</div>

						<p className="text-xs text-[#64748B]">
							Digital settlement occurs via Stellar using AUDD rails.
						</p>

						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : primaryLabel}
						</Button>
					</div>
				)}

				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="text-sm text-[#64748B] hover:text-[#0F172A]"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
