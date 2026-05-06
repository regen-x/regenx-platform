import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/common/button';
import { ICreateTransfer } from '@/interfaces/services/IContractService';

type BuyTokensFormProps = {
	handleSubmit: (payload: ICreateTransfer) => Promise<void>;
	investorAddress: string;
	tokenAddress: string;
	tokenPrice: number;
	tokenSymbol: string;
	projectName?: string;
	minInvestment?: number;
	feeBps?: number;
};

function fmt(n: number) {
	return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function BuyTokensForm({
	handleSubmit,
	investorAddress,
	tokenAddress,
	tokenPrice,
	tokenSymbol,
	projectName,
	minInvestment,
	feeBps = 150,
}: BuyTokensFormProps) {
	const derivedMinInvestment = minInvestment ?? tokenPrice ?? 0;

	const [amountAud, setAmountAud] = useState<number>(derivedMinInvestment);
	const [priceAud, setPriceAud] = useState<number>(tokenPrice);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setAmountAud(derivedMinInvestment);
		setPriceAud(tokenPrice);
	}, [derivedMinInvestment, tokenPrice]);

	const feeRate = feeBps / 10_000;

	const tokens = useMemo(() => {
		if (!priceAud || priceAud <= 0) return 0;
		return amountAud / priceAud;
	}, [amountAud, priceAud]);

	const subtotalAud = useMemo(() => amountAud, [amountAud]);
	const feeAud = useMemo(() => subtotalAud * feeRate, [subtotalAud, feeRate]);
	const totalAud = useMemo(() => subtotalAud + feeAud, [subtotalAud, feeAud]);

	const amountTooLow = amountAud < derivedMinInvestment;
	const invalidPrice = !priceAud || priceAud <= 0;

	const onConfirm = async () => {
		if (amountTooLow || invalidPrice || isSubmitting) return;

		try {
			setIsSubmitting(true);

			await handleSubmit({
				investorAddress,
				amount: tokens,
				tokenAmount: tokens,
				cashAmount: subtotalAud,
				feeAmount: feeAud,
				totalAmount: totalAud,
				tokenAddress,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="rounded-[22px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_10px_rgba(16,24,40,0.04)]">
			<div className="flex flex-col gap-1 border-b border-[#EDF1F7] pb-5">
				<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
					Buy Order
				</div>
				<h3 className="text-[28px] font-semibold tracking-[-0.03em] text-[#163F74]">
					{projectName || 'Project'}
				</h3>
				<p className="text-[14px] text-[#5F6C86]">
					Review your order details before confirming the purchase.
				</p>
			</div>

			<div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
				<div className="space-y-4">
					<div className="rounded-[18px] border border-[#E7ECF4] bg-[#F9FBFE] p-5">
						<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
							Current Price
						</div>
						<div className="mt-2 text-[42px] font-semibold leading-none tracking-[-0.04em] text-[#163F74]">
							${fmt(tokenPrice)}
						</div>
						<div className="mt-2 text-[13px] text-[#5F6C86]">
							Per {tokenSymbol}
						</div>
					</div>

					<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
						<div className="space-y-4">
							<div>
								<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
									Amount (AUD)
								</label>
								<input
									className="h-[54px] w-full rounded-[14px] border border-[#D9E2EF] bg-white px-4 text-[22px] font-semibold text-[#163F74] outline-none transition focus:border-[#1F56D8]"
									type="number"
									min={derivedMinInvestment}
									value={amountAud}
									onChange={(e) => setAmountAud(Number(e.target.value))}
								/>
								{amountTooLow ? (
									<div className="mt-2 text-[12px] text-red-600">
										Amount must be at least ${fmt(derivedMinInvestment)}.
									</div>
								) : (
									<div className="mt-2 text-[12px] text-[#7A879C]">
										Minimum investment: ${fmt(derivedMinInvestment)}
									</div>
								)}
							</div>

							<div>
								<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
									Price Per Token (AUD)
								</label>
								<input
									className="h-[54px] w-full rounded-[14px] border border-[#D9E2EF] bg-[#F9FBFE] px-4 text-[22px] font-semibold text-[#163F74] outline-none transition focus:border-[#1F56D8]"
									type="number"
									min={1}
									value={priceAud}
									onChange={(e) => setPriceAud(Number(e.target.value))}
								/>
								{invalidPrice ? (
									<div className="mt-2 text-[12px] text-red-600">
										Price must be greater than 0.
									</div>
								) : (
									<div className="mt-2 text-[12px] text-[#7A879C]">
										Live price used to estimate token quantity.
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
					<div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
						Order Summary
					</div>

					<div className="space-y-4">
						<SummaryRow label="Token" value={tokenSymbol} />
						<SummaryRow
							label="Estimated tokens"
							value={`${fmt(tokens)} ${tokenSymbol}`}
						/>
						<SummaryRow label="Subtotal" value={`$${fmt(subtotalAud)}`} />
						<SummaryRow
							label={`RegenX fee (${fmt(feeRate * 100)}%)`}
							value={`$${fmt(feeAud)}`}
						/>

						<div className="border-t border-[#E9EDF4] pt-4">
							<SummaryRow
								label="Total payable"
								value={`$${fmt(totalAud)}`}
								strong
								large
							/>
						</div>
					</div>

					<div className="mt-5 rounded-[14px] bg-[#F7F8FB] px-4 py-3">
						<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
							Settlement
						</div>
						<div className="mt-1 text-[13px] text-[#5F6C86]">
							A trustline will be created first if required, then the token
							purchase will be submitted.
						</div>
					</div>

					<Button
						type="button"
						className="mt-6 !h-[56px] w-full rounded-[16px] !bg-[#1F56D8] text-[18px] font-semibold !text-white shadow-[0_10px_24px_rgba(31,86,216,0.24)] hover:!bg-[#194BBC]"
						dataTest="buy-tokens-confirm"
						disabled={amountTooLow || invalidPrice || isSubmitting}
						onClick={onConfirm}
					>
						{isSubmitting ? 'Processing...' : 'Place Buy Order'}
					</Button>
				</div>
			</div>
		</div>
	);
}

function SummaryRow({
	label,
	value,
	strong,
	large,
}: {
	label: string;
	value: string;
	strong?: boolean;
	large?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div
				className={`${large ? 'text-[15px]' : 'text-[14px]'} text-[#5F6C86]`}
			>
				{label}
			</div>
			<div
				className={`text-right ${
					strong
						? large
							? 'text-[18px] font-semibold text-[#163F74]'
							: 'font-semibold text-[#163F74]'
						: 'font-medium text-[#1B2F56]'
				}`}
			>
				{value}
			</div>
		</div>
	);
}
