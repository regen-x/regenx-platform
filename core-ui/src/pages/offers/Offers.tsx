import { ListFilter, SearchX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	AdminActionButton,
	AdminPageHeader,
	AdminSectionCard,
} from '@/components/admin-ui';
import CreateOfferModal from '@/components/modal/create-offer-modal';
import EditOfferPriceModal from '@/components/modal/edit-offer-price-modal';
import { UserType } from '@/constants/enum/user-type.enum';
import { PATHS } from '@/constants/routes/paths';
import useUserTypeLabel from '@/hooks/common/useUserTypeLabel';
import { useSimpleSigner } from '@/hooks/stellar/useSimpleSigner';
import { IOffer } from '@/interfaces/api/IOffer';
import { IProject } from '@/interfaces/api/IProject';
import { ICreateOffer } from '@/interfaces/services/IOfferService';
import { notificationService } from '@/services/notification.service';
import { offerService } from '@/services/offer.service';
import { projectService } from '@/services/project.service';
import { stellarService } from '@/services/stellar.service';
import { useStellarStore } from '@/store/stellar.store';
import { useUserStore } from '@/store/user.store';

type OfferStatus =
	| 'DRAFT'
	| 'LIVE'
	| 'PARTIALLY_FILLED'
	| 'FILLED'
	| 'CANCELLED'
	| 'EXPIRED'
	| 'FAILED';

type MarketOffer = IOffer & {
	derivedStatus: OfferStatus;
	derivedPricePerToken: number;
	derivedQuantity: number;
	derivedRemainingQuantity: number;
	derivedTotalValue: number;
	derivedProjectName: string;
	derivedTokenSymbol: string;
	derivedSellerLabel: string;
};

const STATUS_OPTIONS: OfferStatus[] = [
	'LIVE',
	'PARTIALLY_FILLED',
	'FILLED',
	'CANCELLED',
	'EXPIRED',
	'FAILED',
];

const money = (value: number) =>
	new Intl.NumberFormat('en-AU', {
		style: 'currency',
		currency: 'AUD',
		maximumFractionDigits: 2,
	}).format(value || 0);

const getDerivedStatus = (offer: IOffer): OfferStatus => {
	if (offer.status) return offer.status;
	if (offer.isActive) return 'LIVE';
	return Number(offer.remainingQuantity ?? offer.amount ?? 0) > 0
		? 'CANCELLED'
		: 'FILLED';
};

const maskWallet = (value?: string | null) => {
	const trimmed = String(value ?? '').trim();
	if (!trimmed) return 'Wallet not connected';
	if (trimmed.length <= 12) return trimmed;
	return `${trimmed.slice(0, 6)}...${trimmed.slice(-6)}`;
};

export default function Offers() {
	const { VITE_ISSUER_ADDRESS } = import.meta.env;
	const { user } = useUserStore();
	const { selectedClientPublicKey } = useStellarStore();
	const { userTypeLabel } = useUserTypeLabel({ userType: user?.type });
	const { handleSignTransaction, publicKey } = useSimpleSigner();
	const navigate = useNavigate();

	const [allOffers, setAllOffers] = useState<IOffer[]>([]);
	const [myOffers, setMyOffers] = useState<IOffer[]>([]);
	const [projects, setProjects] = useState<IProject[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [projectFilter, setProjectFilter] = useState('');
	const [sortBy, setSortBy] = useState<'newest' | 'priceLow' | 'priceHigh'>(
		'newest',
	);
	const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
	const [isEditOfferModalOpen, setIsEditOfferModalOpen] = useState(false);
	const [selectedOfferUuid, setSelectedOfferUuid] = useState<string | null>(
		null,
	);
	const [relistSeed, setRelistSeed] = useState<Partial<ICreateOffer> | null>(
		null,
	);
	const [loadingOffers, setLoadingOffers] = useState<{
		cancel?: string | null;
		buy?: string | null;
		update?: string | null;
	}>({});

	const isDeveloper = user?.type === UserType.CLIMATE_DEVELOPER;

	const getCurrentUserAddress = () =>
		user?.type === UserType.WEALTH_MANAGER
			? selectedClientPublicKey
			: user?.walletAddress;

	const currentWallet = getCurrentUserAddress();

	useEffect(() => {
		if (isDeveloper) {
			notificationService.error(
				'Sell Offers is currently available only in the investor experience.',
			);
			navigate(PATHS.DASHBOARD);
		}
	}, [isDeveloper, navigate]);

	useEffect(() => {
		if (isDeveloper || !user) return;

		const load = async () => {
			try {
				setLoading(true);

				const [allResponse, projectResponse] = await Promise.all([
					offerService.getOfferList({
						isActive: true,
						excludeAddress: currentWallet,
					}),
					projectService.getProjectList(),
				]);

				setAllOffers(
					allResponse.data.map(({ attributes, id }: any) => ({
						...attributes,
						id,
					})),
				);
				setProjects(Array.isArray(projectResponse) ? projectResponse : []);

				if (currentWallet) {
					const mineResponse = await offerService.getOfferList({
						userAddress: currentWallet,
					});
					setMyOffers(
						mineResponse.data.map(({ attributes, id }: any) => ({
							...attributes,
							id,
						})),
					);
				} else {
					setMyOffers([]);
				}
			} catch (error) {
				console.error(error);
				notificationService.error('An error occurred while fetching offers');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [currentWallet, isDeveloper, user]);

	const refreshOffers = async () => {
		if (!user) return;
		try {
			setLoading(true);
			const [allResponse, mineResponse] = await Promise.all([
				offerService.getOfferList({
					isActive: true,
					excludeAddress: currentWallet,
				}),
				currentWallet
					? offerService.getOfferList({ userAddress: currentWallet })
					: Promise.resolve({ data: [] } as any),
			]);

			setAllOffers(
				allResponse.data.map(({ attributes, id }: any) => ({
					...attributes,
					id,
				})),
			);
			setMyOffers(
				(mineResponse.data || []).map(({ attributes, id }: any) => ({
					...attributes,
					id,
				})),
			);
		} catch (error) {
			console.error(error);
			notificationService.error('An error occurred while refreshing offers');
		} finally {
			setLoading(false);
		}
	};

	const projectOptions = useMemo(
		() =>
			projects
				.filter(({ uuid }) => uuid)
				.map((project) => ({
					label: `${project.tokenSymbol || project.assetCode} - ${
						project.name
					}`,
					value: project.uuid,
					tokenSymbol: project.tokenSymbol || project.assetCode,
					projectName: project.name,
				})),
		[projects],
	);

	const getAvailableBalance = async (projectUuid: string) => {
		try {
			const selectedProject = projects.find(({ uuid }) => uuid === projectUuid);
			if (!selectedProject || !currentWallet) return;

			const walletBalance = await stellarService.getTokenBalanceForAccount(
				currentWallet,
				VITE_ISSUER_ADDRESS || '',
				selectedProject.tokenSymbol ?? '',
			);
			const reservedBalance = myOffers
				.filter(
					(offer) =>
						String(offer.project?.id || '') === projectUuid &&
						getDerivedStatus(offer) === 'LIVE',
				)
				.reduce(
					(sum, offer) =>
						sum + Number(offer.remainingQuantity ?? offer.amount ?? 0),
					0,
				);

			const availableBalance = Number(walletBalance ?? 0) - reservedBalance;
			return availableBalance > 0 ? availableBalance : 0;
		} catch (error) {
			console.error(error);
			notificationService.error(
				'An error occurred while verifying token balance',
			);
		}
	};

	const marketOffers = useMemo(() => {
		const source = activeTab === 'all' ? allOffers : myOffers;
		const mapped: MarketOffer[] = source.map((offer) => {
			const derivedQuantity = Number(offer.quantity ?? offer.amount ?? 0);
			const derivedRemainingQuantity = Number(
				offer.remainingQuantity ?? offer.amount ?? 0,
			);
			const derivedPricePerToken = Number(
				offer.pricePerToken ?? offer.price ?? 0,
			);
			const derivedTotalValue = Number(
				offer.totalValue ?? derivedRemainingQuantity * derivedPricePerToken,
			);
			const derivedProjectName =
				offer.projectName || offer.project?.name || 'Unnamed project';
			const derivedTokenSymbol =
				offer.tokenSymbol ||
				offer.project?.tokenSymbol ||
				offer.project?.assetCode ||
				'TOKEN';
			const derivedSellerLabel =
				offer.sellerDisplayName ||
				`Investor •••${String(offer.user || '').slice(-3)}`;
			const derivedStatus = getDerivedStatus(offer);

			return {
				...offer,
				derivedStatus,
				derivedPricePerToken,
				derivedQuantity,
				derivedRemainingQuantity,
				derivedTotalValue,
				derivedProjectName,
				derivedTokenSymbol,
				derivedSellerLabel,
			};
		});

		const searched = mapped.filter((offer) => {
			const term = search.trim().toLowerCase();
			if (!term) return true;
			return (
				offer.derivedProjectName.toLowerCase().includes(term) ||
				offer.derivedTokenSymbol.toLowerCase().includes(term)
			);
		});

		const filtered = searched.filter((offer) => {
			if (statusFilter && offer.derivedStatus !== statusFilter) return false;
			if (projectFilter && offer.project?.id !== projectFilter) return false;
			return true;
		});

		return filtered.sort((left, right) => {
			if (sortBy === 'priceLow') {
				return left.derivedPricePerToken - right.derivedPricePerToken;
			}
			if (sortBy === 'priceHigh') {
				return right.derivedPricePerToken - left.derivedPricePerToken;
			}
			return (
				new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
			);
		});
	}, [
		activeTab,
		allOffers,
		myOffers,
		projectFilter,
		search,
		sortBy,
		statusFilter,
	]);

	const handleBuyOffer = async (offer: MarketOffer) => {
		try {
			if (!publicKey || !currentWallet) {
				notificationService.error('Please connect your wallet');
				return navigate(PATHS.CASH_ACCOUNT);
			}

			const userHasTrustline = await stellarService.checkTrustline(
				currentWallet,
				VITE_ISSUER_ADDRESS,
				offer.derivedTokenSymbol,
			);

			if (!userHasTrustline) {
				notificationService.error(
					'Please add the token trustline to your wallet',
				);
				return navigate(`/project/${offer.project?.id || ''}`);
			}

			if (!offer.id) return;

			setLoadingOffers((prev) => ({ ...prev, buy: offer.id }));

			const {
				data: {
					attributes: { transactionXdr },
				},
			} = await offerService.createBuyOfferXdr(offer.id, currentWallet);

			const signedTx = await handleSignTransaction(transactionXdr, publicKey);

			await offerService.submitOfferSignedXdr(
				signedTx,
				'buy_offer',
				currentWallet,
			);

			await refreshOffers();
			notificationService.success('Offer bought successfully');
		} catch (error) {
			console.error(error);
			notificationService.error('An error occurred while buying offer');
		} finally {
			setLoadingOffers((prev) => ({ ...prev, buy: null }));
		}
	};

	const handleEditOfferPrice = async (price: number) => {
		try {
			if (!publicKey || !currentWallet || !selectedOfferUuid) {
				notificationService.error('Please connect your wallet');
				return navigate(PATHS.CASH_ACCOUNT);
			}

			setLoadingOffers((prev) => ({ ...prev, update: selectedOfferUuid }));

			const {
				data: {
					attributes: { transactionXdr },
				},
			} = await offerService.createUpdateOfferPriceXdr(
				selectedOfferUuid,
				price * 10 ** 7,
				currentWallet,
			);

			const signedTx = await handleSignTransaction(transactionXdr, publicKey);
			await offerService.submitOfferSignedXdr(
				signedTx,
				'update_offer',
				currentWallet,
			);

			await refreshOffers();
			notificationService.success('Offer price updated successfully');
		} catch (error) {
			console.error(error);
			notificationService.error('An error occurred while updating offer price');
		} finally {
			setLoadingOffers((prev) => ({ ...prev, update: null }));
			setSelectedOfferUuid(null);
			setIsEditOfferModalOpen(false);
		}
	};

	const handleCancelOffer = async (offerId?: string) => {
		try {
			if (!publicKey || !currentWallet || !offerId) {
				notificationService.error('Please connect your wallet');
				return navigate(PATHS.CASH_ACCOUNT);
			}

			setLoadingOffers((prev) => ({ ...prev, cancel: offerId }));

			const {
				data: {
					attributes: { transactionXdr },
				},
			} = await offerService.createDeactivateOfferXdr(offerId, currentWallet);

			const signedTx = await handleSignTransaction(transactionXdr, publicKey);
			await offerService.submitOfferSignedXdr(
				signedTx,
				'cancel_offer',
				currentWallet,
			);

			await refreshOffers();
			notificationService.success('Offer cancelled successfully');
		} catch (error) {
			console.error(error);
			notificationService.error('An error occurred while cancelling offer');
		} finally {
			setLoadingOffers((prev) => ({ ...prev, cancel: null }));
		}
	};

	const handleCreateOffer = async ({
		amount,
		price,
		projectUuid,
	}: ICreateOffer) => {
		try {
			if (!publicKey || !currentWallet) {
				notificationService.error('Please connect your wallet');
				return navigate(PATHS.CASH_ACCOUNT);
			}

			const tokenBalance = await getAvailableBalance(projectUuid);
			if (tokenBalance == null || tokenBalance < amount) {
				notificationService.error('Quantity cannot exceed available balance');
				return;
			}

			const {
				data: {
					attributes: { transactionXdr },
				},
			} = await offerService.createOfferXdr({
				amount: amount * 10 ** 7,
				price: price * 10 ** 7,
				projectUuid,
				userAddress: currentWallet,
			});

			const signedTx = await handleSignTransaction(transactionXdr, publicKey);
			await offerService.submitOfferSignedXdr(
				signedTx,
				'create_offer',
				currentWallet,
			);

			await refreshOffers();
			notificationService.success('Sell order created successfully');
			setRelistSeed(null);
			setIsCreateOfferModalOpen(false);
		} catch (error) {
			console.error(error);
			notificationService.error('An error occurred while creating offer');
		}
	};

	if (isDeveloper) return null;

	return (
		<div className="theme-page-shell min-h-screen px-4 py-4" data-test="offers">
			<div className="w-full max-w-[1220px]">
				<AdminPageHeader
					eyebrow={userTypeLabel}
					title="Sell Offers"
					description="Create and manage secondary sell orders for tokenised project positions."
					actions={
						<AdminActionButton
							tone="primary"
							onClick={() => {
								setRelistSeed(null);
								setIsCreateOfferModalOpen(true);
							}}
						>
							Create Sell Order
						</AdminActionButton>
					}
				/>

				<div className="mb-4 flex gap-3">
					<TabButton
						active={activeTab === 'all'}
						label="All Offers"
						onClick={() => setActiveTab('all')}
					/>
					<TabButton
						active={activeTab === 'mine'}
						label="My Offers"
						onClick={() => setActiveTab('mine')}
					/>
				</div>

				<AdminSectionCard>
					<div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
						<div className="relative">
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search by project or token symbol"
								className="h-[50px] w-full rounded-[14px] border theme-border theme-card px-4 pr-10 theme-text"
							/>
							<ListFilter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-secondary" />
						</div>
						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value)}
							className="h-[50px] rounded-[14px] border theme-border theme-card px-4 theme-text"
						>
							<option value="">All statuses</option>
							{STATUS_OPTIONS.map((status) => (
								<option key={status} value={status}>
									{status.replace('_', ' ')}
								</option>
							))}
						</select>
						<select
							value={projectFilter}
							onChange={(event) => setProjectFilter(event.target.value)}
							className="h-[50px] rounded-[14px] border theme-border theme-card px-4 theme-text"
						>
							<option value="">All projects</option>
							{projects.map((project) => (
								<option key={project.id} value={project.uuid || project.id}>
									{project.name}
								</option>
							))}
						</select>
						<select
							value={sortBy}
							onChange={(event) =>
								setSortBy(
									event.target.value as 'newest' | 'priceLow' | 'priceHigh',
								)
							}
							className="h-[50px] rounded-[14px] border theme-border theme-card px-4 theme-text"
						>
							<option value="newest">Newest</option>
							<option value="priceLow">Price low to high</option>
							<option value="priceHigh">Price high to low</option>
						</select>
					</div>
				</AdminSectionCard>

				<CreateOfferModal
					isOpen={isCreateOfferModalOpen}
					closeModal={() => {
						setRelistSeed(null);
						setIsCreateOfferModalOpen(false);
					}}
					onSubmit={handleCreateOffer}
					options={projectOptions}
					availableBalanceResolver={getAvailableBalance}
					walletLabel={maskWallet(currentWallet)}
					initialValues={relistSeed}
				/>

				<EditOfferPriceModal
					isOpen={isEditOfferModalOpen}
					closeModal={() => setIsEditOfferModalOpen(false)}
					onSubmit={async ({ price }) => {
						await handleEditOfferPrice(price);
					}}
				/>

				{loading ? (
					<div className="py-10 text-center text-sm theme-text-secondary">
						Loading sell offers...
					</div>
				) : !marketOffers.length ? (
					<EmptyState
						title={
							activeTab === 'all'
								? 'No live sell offers available'
								: 'You have not created any sell offers yet'
						}
						description={
							activeTab === 'all'
								? 'Secondary offers will appear here when investors list tokenised positions for sale.'
								: 'Create a sell order to offer one of your tokenised positions into the secondary market.'
						}
						actionLabel={activeTab === 'mine' ? 'Create Sell Order' : undefined}
						onAction={
							activeTab === 'mine'
								? () => {
										setRelistSeed(null);
										setIsCreateOfferModalOpen(true);
								  }
								: undefined
						}
					/>
				) : (
					<AdminSectionCard>
						<div className="overflow-x-auto">
							<table className="min-w-full border-separate border-spacing-y-3">
								<thead>
									<tr className="text-left text-sm theme-text-secondary">
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Project
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Token Symbol
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											{activeTab === 'all' ? 'Seller' : 'Quantity Listed'}
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											{activeTab === 'all' ? 'Quantity' : 'Quantity Remaining'}
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Price per Token
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Total Value
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Status
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Created
										</th>
										<th className="pb-2 font-medium uppercase tracking-[0.08em]">
											Action
										</th>
									</tr>
								</thead>
								<tbody data-test="offers-list">
									{marketOffers.map((offer) => (
										<tr
											key={offer.id}
											className="theme-card text-sm theme-text"
										>
											<td className="rounded-l-[18px] px-4 py-4 font-medium">
												{offer.derivedProjectName}
											</td>
											<td className="px-4 py-4">{offer.derivedTokenSymbol}</td>
											<td className="px-4 py-4">
												{activeTab === 'all'
													? offer.derivedSellerLabel
													: offer.derivedQuantity.toFixed(2)}
											</td>
											<td className="px-4 py-4">
												{activeTab === 'all'
													? offer.derivedRemainingQuantity.toFixed(2)
													: offer.derivedRemainingQuantity.toFixed(2)}
											</td>
											<td className="px-4 py-4">
												{money(offer.derivedPricePerToken)}
											</td>
											<td className="px-4 py-4 font-semibold">
												{money(offer.derivedTotalValue)}
											</td>
											<td className="px-4 py-4">
												<StatusBadge status={offer.derivedStatus} />
											</td>
											<td className="px-4 py-4 theme-text-secondary">
												{new Date(offer.createdAt).toLocaleDateString()}
											</td>
											<td className="rounded-r-[18px] px-4 py-4">
												<div className="flex flex-wrap gap-2">
													<RowAction
														label="View"
														onClick={() =>
															navigate(`/project/${offer.project?.id}`)
														}
													/>
													{activeTab === 'all' ? (
														<RowAction
															label={
																loadingOffers.buy === offer.id
																	? 'Buying...'
																	: 'Take Offer'
															}
															onClick={() => handleBuyOffer(offer)}
															disabled={
																offer.derivedStatus !== 'LIVE' ||
																loadingOffers.buy === offer.id
															}
															primary
														/>
													) : (
														<>
															{offer.derivedStatus === 'LIVE' ? (
																<>
																	<RowAction
																		label={
																			loadingOffers.cancel === offer.id
																				? 'Cancelling...'
																				: 'Cancel order'
																		}
																		onClick={() => handleCancelOffer(offer.id)}
																		disabled={loadingOffers.cancel === offer.id}
																	/>
																	<RowAction
																		label={
																			loadingOffers.update === offer.id
																				? 'Saving...'
																				: 'Edit price'
																		}
																		onClick={() => {
																			setSelectedOfferUuid(offer.id || null);
																			setIsEditOfferModalOpen(true);
																		}}
																		disabled={loadingOffers.update === offer.id}
																		primary
																	/>
																</>
															) : (
																<RowAction
																	label="Re-list"
																	onClick={() => {
																		setRelistSeed({
																			projectUuid: offer.project?.id,
																			amount: offer.derivedQuantity,
																			price: offer.derivedPricePerToken,
																		});
																		setIsCreateOfferModalOpen(true);
																	}}
																/>
															)}
														</>
													)}
												</div>
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
}

function TabButton({
	active,
	label,
	onClick,
}: {
	active: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-[14px] px-4 py-2 text-sm font-semibold transition ${
				active
					? 'bg-[#DDEBFF] text-[#346FB6]'
					: 'border theme-border theme-card theme-text-secondary'
			}`}
		>
			{label}
		</button>
	);
}

function StatusBadge({ status }: { status: OfferStatus }) {
	const tone =
		status === 'LIVE'
			? 'bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]'
			: status === 'FILLED'
			? 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]'
			: 'bg-[#F2F4F7] text-[#475467] border-[#D0D5DD]';

	return (
		<span
			className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
		>
			{status.replace('_', ' ')}
		</span>
	);
}

function RowAction({
	label,
	onClick,
	disabled,
	primary,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	primary?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`rounded-[12px] px-3 py-2 text-xs font-semibold transition ${
				disabled
					? 'cursor-not-allowed bg-[#EEF2F6] text-[#98A2B3]'
					: primary
					? 'bg-[#2F80ED] text-white hover:bg-[#2775E0]'
					: 'border border-[#E7ECF4] bg-white text-[#163F74] hover:bg-[#F7FAFE]'
			}`}
		>
			{label}
		</button>
	);
}

function EmptyState({
	title,
	description,
	actionLabel,
	onAction,
}: {
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}) {
	return (
		<AdminSectionCard>
			<div className="flex flex-col items-center justify-center px-6 py-14 text-center">
				<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F6FC] text-[#346FB6]">
					<SearchX className="h-6 w-6" />
				</div>
				<h3 className="theme-heading text-[22px] font-semibold">{title}</h3>
				<p className="mt-2 max-w-[520px] text-sm theme-text-secondary">
					{description}
				</p>
				{actionLabel && onAction ? (
					<button
						type="button"
						onClick={onAction}
						className="mt-5 rounded-[14px] bg-[#2F80ED] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2775E0]"
					>
						{actionLabel}
					</button>
				) : null}
			</div>
		</AdminSectionCard>
	);
}
