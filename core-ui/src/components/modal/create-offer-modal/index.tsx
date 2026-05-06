import { useEffect, useMemo, useState } from 'react';

import BaseModal from '../base-modal';

import { ICreateOffer } from '@/interfaces/services/IOfferService';

type ProjectOption = {
	label: string;
	value: string | undefined;
	tokenSymbol?: string;
	projectName?: string;
};

interface ICreateOfferModalProps {
	isOpen: boolean;
	showCloseButtons?: boolean;
	onSubmit: (createOfferFields: ICreateOffer) => Promise<void>;
	closeModal: () => void;
	options: ProjectOption[];
	availableBalanceResolver: (
		projectUuid: string,
	) => Promise<number | undefined>;
	walletLabel?: string;
	initialValues?: Partial<ICreateOffer> | null;
}

const money = (value: number) =>
	new Intl.NumberFormat('en-AU', {
		style: 'currency',
		currency: 'AUD',
		maximumFractionDigits: 2,
	}).format(value || 0);

const CreateOfferModal = ({
	isOpen,
	showCloseButtons,
	onSubmit,
	closeModal,
	options,
	availableBalanceResolver,
	walletLabel,
	initialValues,
}: ICreateOfferModalProps) => {
	const [projectUuid, setProjectUuid] = useState('');
	const [quantity, setQuantity] = useState('');
	const [price, setPrice] = useState('');
	const [availableBalance, setAvailableBalance] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingBalance, setIsLoadingBalance] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!isOpen) return;
		setProjectUuid(String(initialValues?.projectUuid ?? ''));
		setQuantity(
			initialValues?.amount != null ? String(initialValues.amount) : '',
		);
		setPrice(initialValues?.price != null ? String(initialValues.price) : '');
		setAvailableBalance(null);
		setError('');
	}, [isOpen, initialValues]);

	useEffect(() => {
		if (!isOpen || !projectUuid) {
			setAvailableBalance(null);
			return;
		}

		const loadBalance = async () => {
			try {
				setIsLoadingBalance(true);
				const balance = await availableBalanceResolver(projectUuid);
				setAvailableBalance(
					typeof balance === 'number' && Number.isFinite(balance)
						? balance
						: null,
				);
			} finally {
				setIsLoadingBalance(false);
			}
		};

		void loadBalance();
	}, [availableBalanceResolver, isOpen, projectUuid]);

	const selectedProject = useMemo(
		() => options.find((option) => option.value === projectUuid),
		[options, projectUuid],
	);

	const quantityNumber = Number(quantity || 0);
	const priceNumber = Number(price || 0);
	const totalValue =
		quantityNumber > 0 && priceNumber > 0 ? quantityNumber * priceNumber : 0;

	const submit = async () => {
		if (isSubmitting) return;

		if (!projectUuid) {
			setError('Select a project or token first.');
			return;
		}

		if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
			setError('Quantity must be greater than zero.');
			return;
		}

		if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
			setError('Price per token must be greater than zero.');
			return;
		}

		if (availableBalance == null) {
			setError(
				'Available balance is unavailable. Refresh holdings before creating a sell order.',
			);
			return;
		}

		if (availableBalance != null && quantityNumber > availableBalance) {
			setError('Quantity cannot exceed your available balance.');
			return;
		}

		try {
			setError('');
			setIsSubmitting(true);
			await onSubmit({
				projectUuid,
				amount: quantityNumber,
				price: priceNumber,
				userAddress: '',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<BaseModal
			title="Create Sell Order"
			showCloseButtons={showCloseButtons}
			showFooter={false}
			isOpen={isOpen}
			closeModal={closeModal}
			dataTest="create-offer-modal"
		>
			<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<div className="space-y-4">
					<div>
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
							Project / Asset
						</label>
						<select
							value={projectUuid}
							onChange={(event) => setProjectUuid(event.target.value)}
							className="h-[54px] w-full rounded-[14px] border border-[#D9E2EF] bg-white px-4 text-[15px] font-medium text-[#163F74] outline-none focus:border-[#1F56D8]"
							data-test="create-offer-project"
						>
							<option value="">Select project</option>
							{options.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] px-4 py-4">
							<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8EA1BC]">
								Token Symbol
							</div>
							<div className="mt-2 text-[18px] font-semibold text-[#163F74]">
								{selectedProject?.tokenSymbol || 'Select a project'}
							</div>
						</div>
						<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F9FBFE] px-4 py-4">
							<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8EA1BC]">
								Available Balance
							</div>
							<div className="mt-2 text-[18px] font-semibold text-[#163F74]">
								{isLoadingBalance
									? 'Checking...'
									: availableBalance == null
									? 'Unavailable'
									: `${availableBalance.toFixed(2)} ${
											selectedProject?.tokenSymbol || ''
									  }`}
							</div>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
								Quantity to Sell
							</label>
							<input
								value={quantity}
								onChange={(event) => setQuantity(event.target.value)}
								type="number"
								min={0}
								step="any"
								className="h-[54px] w-full rounded-[14px] border border-[#D9E2EF] bg-white px-4 text-[18px] font-semibold text-[#163F74] outline-none focus:border-[#1F56D8]"
								data-test="create-offer-amount"
							/>
						</div>
						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
								Price per Token
							</label>
							<input
								value={price}
								onChange={(event) => setPrice(event.target.value)}
								type="number"
								min={0}
								step="any"
								className="h-[54px] w-full rounded-[14px] border border-[#D9E2EF] bg-white px-4 text-[18px] font-semibold text-[#163F74] outline-none focus:border-[#1F56D8]"
								data-test="create-offer-price"
							/>
						</div>
					</div>

					<div className="rounded-[16px] border border-[#E7ECF4] bg-white px-4 py-4">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8EA1BC]">
							Custody Source
						</div>
						<div className="mt-2 text-[15px] text-[#163F74]">
							Self custody wallet
						</div>
						<div className="mt-1 text-sm text-[#5F6C86]">
							{walletLabel || 'Connect wallet to create sell orders'}
						</div>
					</div>

					{error ? (
						<div className="rounded-[14px] border border-[#F3C6C6] bg-[#FEF6F6] px-4 py-3 text-sm text-[#B42318]">
							{error}
						</div>
					) : null}
				</div>

				<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
					<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8EA1BC]">
						Confirmation Summary
					</div>
					<div className="mt-5 space-y-4">
						<SummaryRow
							label="Project"
							value={selectedProject?.projectName || '—'}
						/>
						<SummaryRow
							label="Token Symbol"
							value={selectedProject?.tokenSymbol || '—'}
						/>
						<SummaryRow
							label="Quantity"
							value={quantityNumber > 0 ? quantityNumber.toFixed(2) : '—'}
						/>
						<SummaryRow
							label="Price per Token"
							value={priceNumber > 0 ? money(priceNumber) : '—'}
						/>
						<SummaryRow
							label="Total Value"
							value={totalValue > 0 ? money(totalValue) : '—'}
							strong
						/>
					</div>

					<div className="mt-5 rounded-[14px] bg-[#F7F8FB] px-4 py-3 text-[13px] text-[#5F6C86]">
						Orders can only be created for balances you currently hold. Price
						updates and cancellations remain available from My Offers while the
						order is live.
					</div>

					<button
						type="button"
						onClick={submit}
						disabled={isSubmitting}
						className="mt-6 h-[52px] w-full rounded-[14px] bg-[#2F80ED] px-4 text-[15px] font-semibold text-white transition hover:bg-[#2775E0] disabled:cursor-not-allowed disabled:bg-[#C7D7F2]"
						data-test="create-offer-submit"
					>
						{isSubmitting ? 'Creating...' : 'Create Sell Order'}
					</button>
				</div>
			</div>
		</BaseModal>
	);
};

function SummaryRow({
	label,
	value,
	strong,
}: {
	label: string;
	value: string;
	strong?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="text-sm text-[#5F6C86]">{label}</div>
			<div
				className={
					strong
						? 'text-right font-semibold text-[#163F74]'
						: 'text-right font-medium text-[#163F74]'
				}
			>
				{value}
			</div>
		</div>
	);
}

export default CreateOfferModal;
