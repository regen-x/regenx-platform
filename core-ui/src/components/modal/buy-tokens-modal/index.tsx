import { useEffect, useMemo, useState } from 'react';

import TokenLink from '@/components/common/TokenLink';

type Props = {
	isOpen: boolean;
	onSubmit: (payload: any) => Promise<void> | void;
	closeModal: () => void;
	investorAddress?: string;
	tokenAddress?: string;
	tokenPrice?: number;
	tokenSymbol?: string;
	projectName?: string;
	projectStatus?: string;
	assetCode?: string;
	assetIssuer?: string;
	distributorWalletPublic?: string;
	onConnectWallet?: () => Promise<void> | void;
	onSignTransaction?: (xdr: string, description: string) => Promise<string>;
};

function toNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export default function BuyTokensModal({
	isOpen,
	onSubmit,
	closeModal,
	investorAddress,
	tokenPrice = 1,
	tokenSymbol = 'TOKEN',
	projectName = 'Investment Opportunity',
	projectStatus,
	assetCode,
	assetIssuer,
	distributorWalletPublic,
}: Props) {
	const [amountAud, setAmountAud] = useState(25000);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!isOpen) {
			setAmountAud(25000);
			setSubmitting(false);
			setError('');
		}
	}, [isOpen]);

	const tokenAmount = useMemo(() => {
		if (!tokenPrice) return 0;
		return toNumber(amountAud / tokenPrice);
	}, [amountAud, tokenPrice]);

	if (!isOpen) return null;

	const handleSubmit = async () => {
		try {
			setSubmitting(true);
			setError('');

			if (projectStatus && projectStatus !== 'live') {
				throw new Error('This project is not live for investment yet.');
			}

			if (!distributorWalletPublic) {
				throw new Error('Project inventory wallet is not configured.');
			}

			await onSubmit({
				custodyType: 'REGENX',
				amount: tokenAmount,
				tokenAmount,
				tokenSymbol,
				investorAddress,
				assetCode,
				assetIssuer,
				distributorWalletPublic,
			});

			closeModal();
		} catch (err: any) {
			setError(err?.message || 'Failed to continue with investment options.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(15,23,42,0.55)] px-4 py-5">
			<div className="w-full max-w-[720px] max-h-[88vh] overflow-y-auto rounded-[20px] border border-[#E7ECF4] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="inline-flex rounded-[8px] bg-[#DDEBFF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
							Investment Review
						</div>
						<h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#163F74]">
							{projectName}
						</h2>
						<p className="mt-2 max-w-[620px] text-[13px] leading-[1.75] text-[#5F6C86]">
							Custody and settlement for this allocation are managed through
							RegenX. Your ownership is recorded and administered through the
							platform without an additional wallet setup step.
						</p>
					</div>

					<button
						type="button"
						onClick={closeModal}
						className="rounded-[12px] border border-[#E7ECF4] px-4 py-2 text-[13px] font-semibold text-[#5F6C86]"
					>
						Close
					</button>
				</div>

				<div className="mt-5 rounded-[18px] border border-[#D7E3FF] bg-[#F4F8FF] p-5">
					<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
						Managed custody
					</div>
					<h3 className="mt-2 text-[18px] font-semibold text-[#163F74]">
						RegenX custody is the active investment path
					</h3>
					<p className="mt-2 text-[13px] leading-[1.75] text-[#5F6C86]">
						Orders are processed through RegenX-managed custody and platform
						settlement operations. Ownership records update through the platform
						workflow after your order is accepted.
					</p>
					<div className="mt-4 grid grid-cols-1 gap-2 text-[12px] text-[#5F6C86] md:grid-cols-3">
						<div className="rounded-[12px] border border-[#E7ECF4] bg-white px-3 py-3">
							No wallet connection required
						</div>
						<div className="rounded-[12px] border border-[#E7ECF4] bg-white px-3 py-3">
							Seamless platform-managed settlement
						</div>
						<div className="rounded-[12px] border border-[#E7ECF4] bg-white px-3 py-3">
							Ownership recorded through RegenX operations
						</div>
					</div>
				</div>

				<div className="mt-5 rounded-[18px] border border-[#E7ECF4] bg-[#F7F8FB] p-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
						<div>
							<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Investment Amount (AUD)
							</div>

							<input
								type="text"
								inputMode="numeric"
								value={amountAud.toLocaleString()}
								onChange={(e) => {
									const raw = e.target.value.replace(/,/g, '');
									setAmountAud(toNumber(raw));
								}}
								className="mt-2 w-full rounded-[12px] border border-[#A9B7CF] bg-white px-4 py-3 text-[16px] font-semibold text-[#1B2F56] outline-none"
							/>

							<div className="mt-4 rounded-[14px] border border-[#E7ECF4] bg-white p-4">
								<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Settlement Rail
								</div>
								<p className="mt-2 text-[13px] leading-[1.75] text-[#5F6C86]">
									Investor commitments are denominated in AUD. Where supported,
									settlement may occur through AUDD for on chain execution and
									reporting, while maintaining an AUD based investment
									experience.
								</p>
							</div>
						</div>

						<div className="rounded-[14px] border border-[#D7E3FF] bg-[#F4F8FF] p-4">
							<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Allocation Summary
							</div>

							<div className="mt-4 space-y-3 text-[13px] text-[#5F6C86]">
								<div className="flex items-center justify-between gap-4">
									<span>Custody model</span>
									<span className="font-semibold text-[#163F74]">
										RegenX managed custody
									</span>
								</div>

								<div className="flex items-center justify-between gap-4">
									<span>Amount (AUD)</span>
									<span className="font-semibold text-[#163F74]">
										${amountAud.toLocaleString()}
									</span>
								</div>

								<div className="flex items-center justify-between gap-4">
									<span>Estimated units</span>
									<span className="font-semibold text-[#163F74]">
										{tokenAmount.toLocaleString()}{' '}
										<TokenLink
											assetCode={assetCode || tokenSymbol}
											assetIssuer={assetIssuer}
											status={projectStatus}
											className="hover:underline"
										>
											{tokenSymbol}
										</TokenLink>
									</span>
								</div>

								<div className="flex items-center justify-between gap-4">
									<span>Settlement</span>
									<span className="max-w-[190px] truncate font-semibold text-[#163F74]">
										Platform managed
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{error ? (
					<div className="mt-4 rounded-[14px] border border-[#F3D2D2] bg-[#FFF5F5] px-4 py-3 text-[12px] text-[#B42318]">
						{error}
					</div>
				) : null}

				<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={closeModal}
						className="rounded-[12px] border border-[#E7ECF4] px-4 py-2.5 text-[13px] font-semibold text-[#5F6C86]"
					>
						Cancel
					</button>

					<button
						type="button"
						onClick={handleSubmit}
						disabled={
							submitting || (projectStatus ? projectStatus !== 'live' : false)
						}
						className="rounded-[12px] bg-[#123DA8] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(18,61,168,0.22)] disabled:opacity-60"
					>
						{submitting
							? 'Submitting investment...'
							: 'Continue with RegenX custody'}
					</button>
				</div>
			</div>
		</div>
	);
}
