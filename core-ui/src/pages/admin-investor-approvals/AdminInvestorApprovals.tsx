import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminPageHeader, AdminStatusBadge } from '@/components/admin-ui';
import BaseModal from '@/components/modal/base-modal';
import { investorVerificationService } from '@/services/investorVerification.service';

type AdminReviewStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'more_info_required';
type SumsubStatus =
	| 'not_started'
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'review_required';
type InvestorEligibilityStatus = 'blocked' | 'approved' | 'suspended';
type ReviewState =
	| 'incomplete'
	| 'admin_pending'
	| 'approved'
	| 'more_info_required'
	| 'rejected'
	| 'eligibility_blocked'
	| 'eligibility_suspended'
	| 'testing_only';
type VerificationOverrideMode = 'none' | 'testnet';
type InvestorCustodyProvider = 'testnet' | 'fireblocks' | 'zodia';
type InvestorCustodySetupType = 'wallet' | 'custody_account';

type InvestorVerificationQueueItem = {
	id: number | null;
	userId: string;
	sumsubApplicantId?: string | null;
	sumsubStatus: SumsubStatus;
	adminReviewStatus: AdminReviewStatus;
	investorEligibilityStatus: InvestorEligibilityStatus;
	wholesaleStatus?: string;
	wholesaleCertificateOriginalName?: string | null;
	wholesaleCertificateExpiryDate?: string | null;
	wholesaleCertificateDownloadUrl?: string | null;
	reviewNotes?: string | null;
	reviewedAt?: string | null;
	reviewedBy?: string | null;
	createdAt?: string;
	email?: string | null;
	fullname?: string | null;
	phoneNumber?: string | null;
	updatedAt?: string;
	eligibilitySource?: 'real_compliance' | 'test_override' | 'none';
	verificationOverrideMode?: VerificationOverrideMode;
	testOverrideActive?: boolean;
	testInvestmentOverride?: boolean;
	testInvestmentOverrideSetAt?: string | null;
	testInvestmentOverrideSetBy?: string | null;
	testInvestmentOverrideNote?: string | null;
	isEligible?: boolean;
	reviewState?: ReviewState;
	custodyProvider?: string | null;
	custodyStatus?: string | null;
};

type InvestorVerificationDetail = InvestorVerificationQueueItem & {
	amlAnswers?: Record<string, any> | null;
};

type InvestorCustodySummary = {
	legalRegistry: string;
	custodyProvider: string | null;
	setupType?: string | null;
	custodyAccountId: string | null;
	publicAddress: string | null;
	custodyStatus: string | null;
	whitelisted: boolean;
	operational?: boolean;
	createdAt?: string | null;
	hasTransactions?: boolean;
	lastTransactionStatus: string | null;
	lastTxHash: string | null;
	lastProviderTransactionId: string | null;
	metadata?: Record<string, any>;
	warning?: string | null;
};

const custodyProviderOptions: Array<{
	value: InvestorCustodyProvider;
	label: string;
	description: string;
}> = [
	{
		value: 'testnet',
		label: 'Testnet Stellar',
		description: 'Creates a real Stellar testnet wallet for MVP testing.',
	},
	{
		value: 'fireblocks',
		label: 'Fireblocks (not connected)',
		description:
			'Creates a placeholder custody account record. Fireblocks API is not connected yet.',
	},
	{
		value: 'zodia',
		label: 'Zodia (not connected)',
		description:
			'Creates a placeholder custody account record. Zodia API is not connected yet.',
	},
];

const formatLabel = (value?: string | null) =>
	String(value || 'pending')
		.replaceAll('_', ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());

const getBadgeTone = (
	status?: string | null,
): 'yellow' | 'pink' | 'blue' | 'gray' => {
	switch (status) {
		case 'approved':
		case 'real_compliance':
		case 'test_override':
			return 'blue';
		case 'rejected':
		case 'blocked':
		case 'suspended':
			return 'pink';
		case 'more_info_required':
		case 'requires_more_info':
		case 'review_required':
		case 'testing_only':
			return 'yellow';
		default:
			return 'gray';
	}
};

const getUnderlyingReviewState = (item: {
	sumsubStatus?: SumsubStatus;
	adminReviewStatus?: AdminReviewStatus;
	investorEligibilityStatus?: InvestorEligibilityStatus;
}) => {
	if (item.adminReviewStatus === 'rejected') return 'rejected';
	if (item.investorEligibilityStatus === 'suspended')
		return 'eligibility_suspended';
	if (item.adminReviewStatus === 'more_info_required')
		return 'more_info_required';
	if (item.sumsubStatus === 'approved' && item.adminReviewStatus === 'approved')
		return 'approved';
	if (item.sumsubStatus === 'approved' && item.adminReviewStatus === 'pending')
		return 'admin_pending';
	if (
		item.sumsubStatus === 'not_started' ||
		item.sumsubStatus === 'pending' ||
		item.sumsubStatus === 'review_required'
	)
		return 'incomplete';
	if (item.investorEligibilityStatus === 'blocked')
		return 'eligibility_blocked';
	return 'incomplete';
};

const renderBadge = (label?: string | null, toneKey?: string | null) => {
	const fallback = label || 'pending';
	return (
		<AdminStatusBadge
			label={formatLabel(fallback)}
			tone={getBadgeTone(toneKey || fallback)}
		/>
	);
};

const SummaryCard = ({
	title,
	value,
	accent,
}: {
	title: string;
	value: string;
	accent: 'blue' | 'pink' | 'yellow' | 'red';
}) => {
	const accentClass =
		accent === 'blue'
			? 'before:bg-[#38BDF8]'
			: accent === 'pink'
			? 'before:bg-[#EC4899]'
			: accent === 'yellow'
			? 'before:bg-[#F59E0B]'
			: 'before:bg-[#F43F5E]';

	return (
		<div
			className={`relative overflow-hidden rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(16,24,40,0.03)] before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] ${accentClass}`}
		>
			<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A96AA]">
				{title}
			</p>
			<h3 className="mt-2 text-[24px] font-semibold leading-none text-[#1263A7]">
				{value}
			</h3>
		</div>
	);
};

const DetailItem = ({
	label,
	value,
}: {
	label: string;
	value?: string | null;
}) => (
	<div className="rounded-[16px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-4">
		<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
			{label}
		</p>
		<p className="mt-2 text-sm font-medium text-[#163F74]">
			{value && String(value).trim() ? value : 'Not provided'}
		</p>
	</div>
);

export default function AdminInvestorApprovals() {
	const adminTestOverrideEnabled =
		String(import.meta.env.VITE_ENABLE_ADMIN_TEST_OVERRIDE).toLowerCase() ===
		'true';
	const [investors, setInvestors] = useState<InvestorVerificationQueueItem[]>(
		[],
	);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | ReviewState>('all');
	const [notesByUserId, setNotesByUserId] = useState<Record<string, string>>(
		{},
	);
	const [processingUserId, setProcessingUserId] = useState<string | null>(null);
	const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(
		null,
	);
	const [selectedInvestorDetail, setSelectedInvestorDetail] =
		useState<InvestorVerificationDetail | null>(null);
	const [selectedCustodySummary, setSelectedCustodySummary] =
		useState<InvestorCustodySummary | null>(null);
	const [isCustodyProcessing, setIsCustodyProcessing] = useState(false);
	const [custodyProvider, setCustodyProvider] =
		useState<InvestorCustodyProvider>('testnet');
	const [custodySetupType, setCustodySetupType] =
		useState<InvestorCustodySetupType>('custody_account');
	const [isDetailLoading, setIsDetailLoading] = useState(false);
	const [pageError, setPageError] = useState('');
	const [pageSuccess, setPageSuccess] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [overrideModal, setOverrideModal] = useState<{
		isOpen: boolean;
		mode: 'enable' | 'disable';
		userId: string | null;
		investorLabel: string;
	}>({
		isOpen: false,
		mode: 'enable',
		userId: null,
		investorLabel: '',
	});
	const [overrideNote, setOverrideNote] = useState('');
	const [overrideError, setOverrideError] = useState('');

	const loadQueue = useCallback(async () => {
		try {
			setIsLoading(true);
			setPageError('');
			const rows = await investorVerificationService.getAdminQueue();
			setInvestors(rows);
			setNotesByUserId((prev) => {
				const next = { ...prev };
				for (const row of rows) {
					next[row.userId] = prev[row.userId] ?? String(row.reviewNotes || '');
				}
				return next;
			});
		} catch (error: any) {
			console.error('Failed to load investor verification queue', error);
			if (Number(error?.response?.status) === 404) {
				setInvestors([]);
				setPageError('');
				return;
			}
			setPageError(
				error?.response?.data?.message ||
					error?.message ||
					'Failed to load investor verification queue.',
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadQueue();
	}, [loadQueue]);

	const filteredInvestors = useMemo(() => {
		const query = search.trim().toLowerCase();

		return [...investors]
			.filter((item) => {
				if (!query) return true;
				return (
					String(item.fullname || '')
						.toLowerCase()
						.includes(query) ||
					String(item.email || '')
						.toLowerCase()
						.includes(query) ||
					String(item.phoneNumber || '')
						.toLowerCase()
						.includes(query)
				);
			})
			.filter((item) => {
				if (statusFilter === 'all') return true;
				return item.reviewState === statusFilter;
			})
			.sort(
				(a, b) =>
					new Date(b.updatedAt || 0).getTime() -
					new Date(a.updatedAt || 0).getTime(),
			);
	}, [investors, search, statusFilter]);

	const openInvestorReview = async (userId: string) => {
		try {
			setSelectedInvestorId(userId);
			setSelectedInvestorDetail(null);
			setSelectedCustodySummary(null);
			setIsDetailLoading(true);
			setPageError('');
			const detail = await investorVerificationService.getAdminDetail(userId);
			setSelectedInvestorDetail(detail);
			try {
				const custody = await investorVerificationService.getCustodySummary(
					userId,
				);
				setSelectedCustodySummary(custody);
				if (
					custody?.custodyProvider &&
					['testnet', 'fireblocks', 'zodia'].includes(custody.custodyProvider)
				) {
					setCustodyProvider(
						custody.custodyProvider as InvestorCustodyProvider,
					);
				} else {
					setCustodyProvider('testnet');
				}
				setCustodySetupType(
					custody?.setupType === 'wallet' ? 'wallet' : 'custody_account',
				);
			} catch (custodyError) {
				setSelectedCustodySummary(null);
				setCustodyProvider('testnet');
				setCustodySetupType('custody_account');
			}
			setNotesByUserId((prev) => ({
				...prev,
				[userId]: prev[userId] ?? String(detail.reviewNotes || ''),
			}));
		} catch (error: any) {
			console.error('Failed to load investor review detail', error);
			if (Number(error?.response?.status) === 404) {
				setPageError(
					'Investor verification detail is not available right now.',
				);
				return;
			}
			setPageError(
				error?.response?.data?.message ||
					error?.message ||
					'Failed to load investor review detail.',
			);
		} finally {
			setIsDetailLoading(false);
		}
	};

	const counts = useMemo(
		() => ({
			incomplete: investors.filter((item) => item.reviewState === 'incomplete')
				.length,
			sumsubApprovedPendingAdmin: investors.filter(
				(item) => item.reviewState === 'admin_pending',
			).length,
			moreInfo: investors.filter(
				(item) => item.reviewState === 'more_info_required',
			).length,
			approved: investors.filter((item) => item.reviewState === 'approved')
				.length,
			rejected: investors.filter((item) => item.reviewState === 'rejected')
				.length,
			testingOnly: investors.filter(
				(item) => item.reviewState === 'testing_only',
			).length,
		}),
		[investors],
	);

	const submitReview = async (
		userId: string,
		adminReviewStatus: 'approved' | 'rejected' | 'more_info_required',
	) => {
		const reviewNotes = String(notesByUserId[userId] || '').trim();
		if (adminReviewStatus !== 'approved' && !reviewNotes) {
			setPageError(
				'Please enter review notes before rejecting or requesting more information.',
			);
			return;
		}

		try {
			setProcessingUserId(userId);
			setPageError('');
			setPageSuccess('');
			await investorVerificationService.reviewInvestor(userId, {
				adminReviewStatus,
				reviewNotes: reviewNotes || undefined,
			});
			await loadQueue();
			if (selectedInvestorId === userId) {
				const detail = await investorVerificationService.getAdminDetail(userId);
				setSelectedInvestorDetail(detail);
				try {
					const custody = await investorVerificationService.getCustodySummary(
						userId,
					);
					setSelectedCustodySummary(custody);
				} catch (custodyError) {
					setSelectedCustodySummary(null);
				}
			}
			setPageSuccess(
				`Investor review updated to ${formatLabel(adminReviewStatus)}.`,
			);
		} catch (error: any) {
			console.error('Failed to update investor review', error);
			if (Number(error?.response?.status) === 404) {
				setPageError(
					'Investor review actions are not available in this environment yet.',
				);
				return;
			}
			setPageError(
				error?.response?.data?.message ||
					error?.message ||
					'Failed to update investor review.',
			);
		} finally {
			setProcessingUserId(null);
		}
	};

	const openOverrideModal = (
		item: InvestorVerificationQueueItem | InvestorVerificationDetail,
		mode: 'enable' | 'disable',
	) => {
		setOverrideError('');
		setPageError('');
		setPageSuccess('');
		setOverrideModal({
			isOpen: true,
			mode,
			userId: item.userId,
			investorLabel: item.fullname || item.email || `Investor ${item.userId}`,
		});
		setOverrideNote(
			mode === 'enable' ? String(item.testInvestmentOverrideNote || '') : '',
		);
	};

	const closeOverrideModal = () => {
		if (overrideModal.userId && processingUserId === overrideModal.userId)
			return;
		setOverrideModal({
			isOpen: false,
			mode: 'enable',
			userId: null,
			investorLabel: '',
		});
		setOverrideNote('');
		setOverrideError('');
	};

	const mergeInvestorOverrideSnapshot = (
		userId: string,
		snapshot: Partial<InvestorVerificationQueueItem>,
	) => {
		setInvestors((prev) =>
			prev.map((item) =>
				item.userId === userId
					? {
							...item,
							...snapshot,
					  }
					: item,
			),
		);

		setSelectedInvestorDetail((prev) =>
			prev && prev.userId === userId
				? {
						...prev,
						...snapshot,
				  }
				: prev,
		);
	};

	const submitTestOverride = async () => {
		const userId = String(overrideModal.userId || '').trim();
		if (!userId) {
			setOverrideError(
				'The selected investor could not be identified. Please close the modal and try again.',
			);
			return;
		}
		if (processingUserId === userId) return;

		const note = overrideNote.trim() || undefined;
		const verificationOverrideMode =
			overrideModal.mode === 'enable' ? 'testnet' : 'none';

		try {
			setProcessingUserId(userId);
			setOverrideError('');
			setPageError('');
			setPageSuccess('');
			const snapshot =
				await investorVerificationService.setVerificationOverrideMode(userId, {
					verificationOverrideMode,
					note,
				});

			mergeInvestorOverrideSnapshot(userId, snapshot);
			closeOverrideModal();

			setPageSuccess(
				overrideModal.mode === 'enable'
					? 'Test override enabled for this investor in non-production.'
					: 'Test override disabled for this investor.',
			);

			try {
				await loadQueue();
				if (selectedInvestorId === userId) {
					const detail = await investorVerificationService.getAdminDetail(
						userId,
					);
					setSelectedInvestorDetail(detail);
				}
			} catch (refreshError: any) {
				console.error(
					'Test override updated but the investor queue refresh failed',
					refreshError,
				);
				setPageError(
					'The test override was updated, but the page could not refresh automatically. Please refresh the queue.',
				);
			}
		} catch (error: any) {
			console.error('Failed to update test override', error);
			setOverrideError(
				error?.response?.data?.message ||
					error?.message ||
					'Failed to update the investor test override.',
			);
		} finally {
			setProcessingUserId(null);
		}
	};

	const createOrRetryCustody = async (userId: string) => {
		try {
			setIsCustodyProcessing(true);
			setPageError('');
			setPageSuccess('');
			const custody = await investorVerificationService.createOrRetryCustody(
				userId,
				{
					provider: custodyProvider,
					mode: custodySetupType,
				},
			);
			setSelectedCustodySummary(custody);
			setPageSuccess('Custody setup request completed.');
		} catch (error: any) {
			console.error('Failed to create or retry custody setup', error);
			setPageError(
				error?.response?.data?.message ||
					error?.message ||
					'Failed to create or retry custody setup.',
			);
		} finally {
			setIsCustodyProcessing(false);
		}
	};

	const amlEntries = useMemo(() => {
		if (!selectedInvestorDetail?.amlAnswers) return [];

		return Object.entries(selectedInvestorDetail.amlAnswers).map(
			([key, value]) => ({
				label: formatLabel(key),
				value:
					value == null || value === ''
						? 'Not provided'
						: typeof value === 'boolean'
						? value
							? 'Yes'
							: 'No'
						: String(value),
			}),
		);
	}, [selectedInvestorDetail]);

	return (
		<div
			className="bg-[#F7F8FB] px-4 py-4"
			data-test="admin-investor-approvals"
		>
			<div className="max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title="Investor Approvals"
					description="Review Sumsub, RegenX admin review, eligibility gating, and the non-production Testing Only override without changing the underlying compliance outcome."
				/>

				{!adminTestOverrideEnabled ? (
					<div className="mb-4 rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#5F6C86] shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						Test override is disabled for this environment.
					</div>
				) : null}

				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
					<SummaryCard
						title="Incomplete"
						value={String(counts.incomplete)}
						accent="yellow"
					/>
					<SummaryCard
						title="Awaiting Admin Review"
						value={String(counts.sumsubApprovedPendingAdmin)}
						accent="blue"
					/>
					<SummaryCard
						title="More Info Required"
						value={String(counts.moreInfo)}
						accent="pink"
					/>
					<SummaryCard
						title="Approved"
						value={String(counts.approved)}
						accent="blue"
					/>
					<SummaryCard
						title="Rejected"
						value={String(counts.rejected)}
						accent="red"
					/>
					<SummaryCard
						title="Testing Only"
						value={String(counts.testingOnly)}
						accent="yellow"
					/>
				</div>

				<div className="mt-6 rounded-[18px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_220px_180px]">
						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Investor Search
							</label>
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								className="w-full rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#163F74] outline-none placeholder:text-[#98A2B3]"
								placeholder="Search investor name, email, or phone"
								data-test="admin-investor-approvals-search"
							/>
						</div>

						<div>
							<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Review State
							</label>
							<select
								value={statusFilter}
								onChange={(event) =>
									setStatusFilter(event.target.value as 'all' | ReviewState)
								}
								className="w-full rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#163F74] outline-none"
								data-test="admin-investor-approvals-filter"
							>
								<option value="all">All review states</option>
								<option value="incomplete">Incomplete</option>
								<option value="admin_pending">Admin pending</option>
								<option value="approved">Approved</option>
								<option value="more_info_required">More info required</option>
								<option value="rejected">Rejected</option>
								<option value="eligibility_blocked">Eligibility blocked</option>
								<option value="eligibility_suspended">
									Eligibility suspended
								</option>
								<option value="testing_only">Testing Only</option>
							</select>
						</div>

						<div className="flex items-end">
							<button
								type="button"
								onClick={() => void loadQueue()}
								className="w-full rounded-[14px] border border-[#2F80ED] bg-[#2F80ED] px-4 py-3 text-sm font-semibold text-white"
								data-test="admin-investor-approvals-refresh"
							>
								Refresh Queue
							</button>
						</div>
					</div>
				</div>

				{pageError ? (
					<div
						className="mt-4 rounded-[18px] border border-[#F6CDD6] bg-[#FFF4F7] px-4 py-3 text-sm text-[#B4235D]"
						data-test="admin-investor-approvals-error"
					>
						{pageError}
					</div>
				) : null}

				{pageSuccess ? (
					<div className="mt-4 rounded-[18px] border border-[#CDECD7] bg-[#EBF8F0] px-4 py-3 text-sm text-[#0B7A33]">
						{pageSuccess}
					</div>
				) : null}

				<div className="mt-6 rounded-[18px] border border-[#E7ECF4] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					{isLoading ? (
						<div className="text-sm text-[#5F6C86]">
							Loading investor approvals...
						</div>
					) : (
						<table className="w-full table-fixed border-separate border-spacing-y-2">
							<thead>
								<tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#8A96AA]">
									<th className="w-[24%] pb-2 font-semibold">Investor</th>
									<th className="w-[11%] pb-2 font-semibold">Sumsub</th>
									<th className="w-[13%] pb-2 font-semibold">Admin Review</th>
									<th className="w-[12%] pb-2 font-semibold">Eligibility</th>
									<th className="w-[11%] pb-2 font-semibold">Test Mode</th>
									<th className="w-[11%] pb-2 font-semibold">Custody</th>
									<th className="w-[10%] pb-2 font-semibold">Updated</th>
									<th className="w-[8%] pb-2 text-right font-semibold">
										Action
									</th>
								</tr>
							</thead>

							<tbody>
								{filteredInvestors.map((item) => {
									const isBusy = processingUserId === item.userId;
									const isTestingOnly = Boolean(item.testOverrideActive);
									const investorLabel =
										item.fullname || item.email || `User ${item.userId}`;

									return (
										<tr
											key={item.userId}
											className="rounded-[18px] bg-[#FCFDFE] text-sm text-[#163F74]"
											data-test={`investor-approval-row-${item.userId}`}
										>
											<td className="rounded-l-2xl px-3 py-3 align-middle">
												<div className="truncate font-semibold">
													{investorLabel}
												</div>
												<div className="mt-1 truncate text-xs text-[#5F6C86]">
													{item.email || 'No email'}
												</div>
											</td>

											<td className="px-2 py-3 align-middle">
												{renderBadge(item.sumsubStatus || 'not_started')}
											</td>

											<td className="px-2 py-3 align-middle">
												{renderBadge(item.adminReviewStatus || 'pending')}
											</td>

											<td className="px-2 py-3 align-middle">
												{renderBadge(
													item.investorEligibilityStatus || 'blocked',
												)}
											</td>

											<td className="px-2 py-3 align-middle">
												{renderBadge(
													isTestingOnly ? 'testing_only' : 'standard',
													isTestingOnly ? 'testing_only' : 'standard',
												)}
											</td>

											<td className="px-2 py-3 align-middle">
												{renderBadge(
													item.custodyStatus ||
														(item.custodyProvider
															? 'configured'
															: 'not_loaded'),
												)}
											</td>

											<td className="px-2 py-3 align-middle text-xs text-[#5F6C86]">
												{item.updatedAt
													? new Date(item.updatedAt).toLocaleDateString()
													: '—'}
											</td>

											<td className="rounded-r-2xl px-3 py-3 text-right align-middle">
												<button
													type="button"
													onClick={() => void openInvestorReview(item.userId)}
													disabled={isBusy}
													className="w-full rounded-[12px] border border-[#DCE7F5] bg-[#F8FBFF] px-3 py-2 text-xs font-semibold text-[#346FB6] disabled:cursor-not-allowed disabled:opacity-60"
													data-test={`investor-approval-detail-${item.userId}`}
												>
													View
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}

					{!isLoading && filteredInvestors.length === 0 ? (
						<div
							className="py-10 text-center text-sm text-[#5F6C86]"
							data-test="admin-investor-approvals-empty"
						>
							No investor verification records are currently in the queue.
						</div>
					) : null}
				</div>
			</div>

			{selectedInvestorId ? (
				<div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/30">
					<div className="flex h-full w-full flex-col border-l border-[#E7ECF4] bg-white shadow-[-8px_0_32px_rgba(15,23,42,0.12)] md:max-w-[640px]">
						<div className="shrink-0 border-b border-[#E7ECF4] bg-white px-6 py-5">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
										Investor Review
									</p>
									<h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[#163F74]">
										{selectedInvestorDetail?.fullname ||
											selectedInvestorDetail?.email ||
											`Investor ${selectedInvestorId}`}
									</h2>
									<p className="mt-2 text-sm text-[#5F6C86]">
										Review Sumsub status, supporting documents, AML responses,
										and RegenX internal approval in one place.
									</p>
								</div>
								<button
									type="button"
									onClick={() => {
										setSelectedInvestorId(null);
										setSelectedInvestorDetail(null);
									}}
									className="rounded-[12px] border border-[#E7ECF4] px-3 py-2 text-sm font-semibold text-[#163F74]"
								>
									Close
								</button>
							</div>
						</div>

						<div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
							{isDetailLoading ? (
								<div className="rounded-[18px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-4 text-sm text-[#5F6C86]">
									Loading investor review detail...
								</div>
							) : selectedInvestorDetail ? (
								<>
									<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
										<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
											Investor Details
										</p>
										<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
											<DetailItem
												label="Investor Name"
												value={selectedInvestorDetail.fullname}
											/>
											<DetailItem
												label="Email"
												value={selectedInvestorDetail.email}
											/>
											<DetailItem
												label="Phone"
												value={selectedInvestorDetail.phoneNumber}
											/>
											<DetailItem
												label="Sumsub Applicant ID"
												value={selectedInvestorDetail.sumsubApplicantId}
											/>
											<DetailItem
												label="Created Date"
												value={
													selectedInvestorDetail.createdAt
														? new Date(
																selectedInvestorDetail.createdAt,
														  ).toLocaleString()
														: null
												}
											/>
											<DetailItem
												label="Last Updated Date"
												value={
													selectedInvestorDetail.updatedAt
														? new Date(
																selectedInvestorDetail.updatedAt,
														  ).toLocaleString()
														: null
												}
											/>
										</div>
									</div>

									<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
										<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
											Verification Status
										</p>
										<div className="mt-4 flex flex-wrap gap-2">
											{renderBadge(
												selectedInvestorDetail.sumsubStatus || 'not_started',
											)}
											{renderBadge(
												selectedInvestorDetail.adminReviewStatus || 'pending',
											)}
											{renderBadge(
												selectedInvestorDetail.investorEligibilityStatus ||
													'blocked',
											)}
											{renderBadge(
												selectedInvestorDetail.testOverrideActive
													? 'testing_only'
													: selectedInvestorDetail.reviewState || 'incomplete',
											)}
											{renderBadge(
												selectedInvestorDetail.wholesaleStatus || 'pending',
											)}
											{selectedInvestorDetail.testOverrideActive ? (
												<AdminStatusBadge label="Testing Only" tone="yellow" />
											) : null}
										</div>
										{selectedInvestorDetail.testOverrideActive ? (
											<div className="mt-4 rounded-[14px] border border-[#FAD7C2] bg-[#FFF7F2] px-4 py-3 text-sm text-[#7A5A00]">
												<div className="font-semibold text-[#B54708]">
													Testing Only is enabled for this investor in
													non-production.
												</div>
												<div className="mt-1 text-[#8A6A11]">
													Underlying review state:{' '}
													{formatLabel(
														getUnderlyingReviewState(selectedInvestorDetail),
													)}
												</div>
											</div>
										) : null}

										<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
											<DetailItem
												label="Sumsub Applicant"
												value={selectedInvestorDetail.sumsubApplicantId}
											/>
											<DetailItem
												label="Reviewed By"
												value={selectedInvestorDetail.reviewedBy}
											/>
											<DetailItem
												label="Created"
												value={
													selectedInvestorDetail.createdAt
														? new Date(
																selectedInvestorDetail.createdAt,
														  ).toLocaleString()
														: null
												}
											/>
											<DetailItem
												label="Last Updated"
												value={
													selectedInvestorDetail.updatedAt
														? new Date(
																selectedInvestorDetail.updatedAt,
														  ).toLocaleString()
														: null
												}
											/>
											<DetailItem
												label="Reviewed At"
												value={
													selectedInvestorDetail.reviewedAt
														? new Date(
																selectedInvestorDetail.reviewedAt,
														  ).toLocaleString()
														: null
												}
											/>
											<DetailItem
												label="Eligibility Source"
												value={formatLabel(
													selectedInvestorDetail.eligibilitySource || 'none',
												)}
											/>
											<DetailItem
												label="Verification Path"
												value={
													selectedInvestorDetail.verificationOverrideMode ===
													'testnet'
														? 'Testing Only'
														: 'Standard / Live verification'
												}
											/>
											<DetailItem
												label="Test Override Set By"
												value={
													selectedInvestorDetail.testInvestmentOverrideSetBy
												}
											/>
											<DetailItem
												label="Test Override Set At"
												value={
													selectedInvestorDetail.testInvestmentOverrideSetAt
														? new Date(
																selectedInvestorDetail.testInvestmentOverrideSetAt,
														  ).toLocaleString()
														: null
												}
											/>
											<DetailItem
												label="Test Override Note"
												value={
													selectedInvestorDetail.testInvestmentOverrideNote
												}
											/>
											<DetailItem
												label="Certificate Expiry"
												value={
													selectedInvestorDetail.wholesaleCertificateExpiryDate
														? new Date(
																selectedInvestorDetail.wholesaleCertificateExpiryDate,
														  ).toLocaleDateString()
														: null
												}
											/>
										</div>
									</div>

									<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
											<div>
												<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
													Custody &amp; Settlement
												</p>
												<p className="mt-2 text-sm leading-[1.6] text-[#5F6C86]">
													Choose the admin custody setup path for this investor.
													Fireblocks and Zodia are recorded as placeholder
													custody accounts until integrations are connected.
												</p>
												{!selectedCustodySummary?.custodyAccountId ? (
													<p className="mt-3 rounded-[14px] border border-[#F2D39B] bg-[#FFF9EC] px-4 py-3 text-sm font-semibold text-[#8A5A00]">
														No custody setup exists yet.
													</p>
												) : null}
												{selectedCustodySummary?.custodyStatus === 'failed' ||
												selectedCustodySummary?.warning ? (
													<p className="mt-3 rounded-[14px] border border-[#FAD7C2] bg-[#FFF7F2] px-4 py-3 text-sm font-semibold text-[#B54708]">
														{selectedCustodySummary?.warning ||
															'Investor approval succeeded, but custody setup failed. Retry custody setup from admin.'}
													</p>
												) : null}
												{selectedCustodySummary?.hasTransactions ? (
													<p className="mt-3 rounded-[14px] border border-[#FAD7C2] bg-[#FFF7F2] px-4 py-3 text-sm font-semibold text-[#B54708]">
														Custody provider switching is disabled because
														transactions have been created.
													</p>
												) : null}
											</div>
										</div>

										<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
											<label className="text-sm font-semibold text-[#163F74]">
												Custody Provider
												<select
													value={custodyProvider}
													onChange={(event) =>
														setCustodyProvider(
															event.target.value as InvestorCustodyProvider,
														)
													}
													disabled={Boolean(
														selectedCustodySummary?.hasTransactions,
													)}
													className="mt-2 w-full rounded-[14px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED] disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3]"
												>
													{custodyProviderOptions.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</select>
											</label>

											<label className="text-sm font-semibold text-[#163F74]">
												Setup Type
												<select
													value={custodySetupType}
													onChange={(event) =>
														setCustodySetupType(
															event.target.value as InvestorCustodySetupType,
														)
													}
													disabled={Boolean(
														selectedCustodySummary?.hasTransactions,
													)}
													className="mt-2 w-full rounded-[14px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED] disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3]"
												>
													<option value="wallet">Wallet</option>
													<option value="custody_account">
														Custody Account
													</option>
												</select>
											</label>
										</div>

										<div className="mt-3 rounded-[14px] border border-[#E7ECF4] bg-[#F8FBFF] px-4 py-3 text-sm text-[#5F6C86]">
											{
												custodyProviderOptions.find(
													(option) => option.value === custodyProvider,
												)?.description
											}
										</div>

										<div className="mt-4 flex flex-wrap gap-3">
											<button
												type="button"
												onClick={() =>
													selectedInvestorDetail?.userId
														? createOrRetryCustody(
																selectedInvestorDetail.userId,
														  )
														: undefined
												}
												disabled={
													isCustodyProcessing || !selectedInvestorDetail?.userId
												}
												className="rounded-[12px] border border-[#DCE7F5] bg-[#F8FBFF] px-4 py-3 text-sm font-semibold text-[#346FB6] disabled:cursor-not-allowed disabled:opacity-60"
											>
												{isCustodyProcessing
													? 'Processing...'
													: selectedCustodySummary?.custodyAccountId
													? 'Retry / Recreate Custody Setup'
													: 'Create Custody Setup'}
											</button>
										</div>

										<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
											<DetailItem
												label="Legal Registry"
												value={
													selectedCustodySummary?.legalRegistry ||
													'FundBase / FB Corp'
												}
											/>
											<DetailItem
												label="Custody Provider"
												value={formatLabel(
													selectedCustodySummary?.custodyProvider ||
														'not configured',
												)}
											/>
											<DetailItem
												label="Setup Type"
												value={formatLabel(
													selectedCustodySummary?.setupType || 'not configured',
												)}
											/>
											<DetailItem
												label="Custody Account ID"
												value={selectedCustodySummary?.custodyAccountId}
											/>
											<DetailItem
												label="Public Address"
												value={selectedCustodySummary?.publicAddress}
											/>
											<DetailItem
												label="Custody Status"
												value={formatLabel(
													selectedCustodySummary?.custodyStatus ||
														'not started',
												)}
											/>
											<DetailItem
												label="Whitelisted"
												value={
													selectedCustodySummary?.whitelisted ? 'Yes' : 'No'
												}
											/>
											<DetailItem
												label="Created At"
												value={
													selectedCustodySummary?.createdAt
														? new Date(
																selectedCustodySummary.createdAt,
														  ).toLocaleString()
														: null
												}
											/>
											<DetailItem
												label="Operational"
												value={
													selectedCustodySummary?.operational ? 'Yes' : 'No'
												}
											/>
											<DetailItem
												label="Last Transaction Status"
												value={formatLabel(
													selectedCustodySummary?.lastTransactionStatus ||
														'not available',
												)}
											/>
											<DetailItem
												label="Last Tx Hash"
												value={selectedCustodySummary?.lastTxHash}
											/>
										</div>
									</div>

									<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
										<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
											Supporting Documents
										</p>
										<div className="mt-4 grid gap-3">
											<DetailItem
												label="Wholesale Certificate"
												value={
													selectedInvestorDetail.wholesaleCertificateOriginalName
												}
											/>
											{selectedInvestorDetail.wholesaleCertificateDownloadUrl ? (
												<a
													href={
														selectedInvestorDetail.wholesaleCertificateDownloadUrl
													}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex w-fit rounded-[12px] border border-[#DCE7F5] bg-[#F8FBFF] px-4 py-2 text-sm font-semibold text-[#346FB6]"
												>
													Open uploaded document
												</a>
											) : (
												<p className="text-sm text-[#5F6C86]">
													No uploaded wholesale certificate is attached yet.
												</p>
											)}
										</div>
									</div>

									<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
										<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
											AML / CTF Questionnaire
										</p>
										{amlEntries.length ? (
											<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
												{amlEntries.map((entry) => (
													<DetailItem
														key={entry.label}
														label={entry.label}
														value={entry.value}
													/>
												))}
											</div>
										) : (
											<p className="mt-4 text-sm text-[#5F6C86]">
												No AML / CTF questionnaire answers have been saved yet.
											</p>
										)}
									</div>

									{adminTestOverrideEnabled ? (
										<div className="rounded-[18px] border border-[#FAD7C2] bg-[#FFFDF8] p-5">
											<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B54708]">
												Testing Only Control
											</p>
											<p className="mt-3 text-sm leading-6 text-[#7A5A00]">
												Switch this investor between the standard / live
												verification path and the non-production Testing Only
												override. Real compliance approval remains separate.
											</p>
											<div className="mt-4 flex flex-wrap items-center gap-2">
												{renderBadge(
													selectedInvestorDetail.testOverrideActive
														? 'testing_only'
														: 'standard_verification',
													selectedInvestorDetail.testOverrideActive
														? 'testing_only'
														: 'standard_verification',
												)}
											</div>
											{selectedInvestorDetail.testInvestmentOverrideNote ? (
												<p className="mt-3 rounded-[14px] border border-[#FCE7C2] bg-white px-4 py-3 text-sm text-[#7A5A00]">
													<span className="font-semibold">Current note:</span>{' '}
													{selectedInvestorDetail.testInvestmentOverrideNote}
												</p>
											) : null}
										</div>
									) : (
										<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5 text-sm text-[#5F6C86]">
											Test override is disabled for this environment.
										</div>
									)}

									<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5">
										<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
											Admin Review Notes
										</p>
										<textarea
											value={notesByUserId[selectedInvestorId] || ''}
											onChange={(event) =>
												setNotesByUserId((prev) => ({
													...prev,
													[selectedInvestorId]: event.target.value,
												}))
											}
											className="mt-4 min-h-[130px] w-full rounded-[16px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#163F74] outline-none"
											placeholder="Document the approval decision, rejection reason, or requested follow-up information"
										/>
									</div>
								</>
							) : (
								<div className="rounded-[18px] border border-[#F6CDD6] bg-[#FFF4F7] px-4 py-4 text-sm text-[#B4235D]">
									Unable to load investor review detail.
								</div>
							)}
						</div>

						{selectedInvestorDetail ? (
							<div className="shrink-0 border-t border-[#E7ECF4] bg-white px-6 py-4">
								<div className="mb-3 rounded-[14px] border border-[#F2D39B] bg-[#FFF9EC] px-4 py-3 text-sm text-[#8A5A00]">
									Testing Only. Non-production access. Does not change
									underlying compliance status.
								</div>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<button
										type="button"
										onClick={() =>
											void submitReview(selectedInvestorId, 'approved')
										}
										disabled={
											processingUserId === selectedInvestorId ||
											selectedInvestorDetail.sumsubStatus !== 'approved'
										}
										className="rounded-[12px] bg-[#2F80ED] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
									>
										{processingUserId === selectedInvestorId
											? 'Working...'
											: 'Approve Access'}
									</button>
									<button
										type="button"
										onClick={() =>
											void submitReview(
												selectedInvestorId,
												'more_info_required',
											)
										}
										disabled={processingUserId === selectedInvestorId}
										className="rounded-[12px] border border-[#E7ECF4] px-4 py-3 text-sm font-semibold text-[#163F74] disabled:cursor-not-allowed disabled:opacity-60"
									>
										Request More Info
									</button>
									<button
										type="button"
										onClick={() =>
											void submitReview(selectedInvestorId, 'rejected')
										}
										disabled={processingUserId === selectedInvestorId}
										className="rounded-[12px] border border-[#F6CDD6] px-4 py-3 text-sm font-semibold text-[#B4235D] disabled:cursor-not-allowed disabled:opacity-60"
									>
										Reject Access
									</button>
									{adminTestOverrideEnabled ? (
										<button
											type="button"
											onClick={() =>
												openOverrideModal(
													selectedInvestorDetail,
													selectedInvestorDetail.testInvestmentOverride
														? 'disable'
														: 'enable',
												)
											}
											disabled={processingUserId === selectedInvestorId}
											className={`rounded-[12px] px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
												selectedInvestorDetail.testInvestmentOverride
													? 'border border-[#FAD7C2] bg-[#FFF7F2] text-[#B54708]'
													: 'border border-[#DCE7F5] bg-[#F8FBFF] text-[#346FB6]'
											}`}
										>
											{selectedInvestorDetail.testInvestmentOverride
												? 'Disable Test Override'
												: 'Enable Test Override'}
										</button>
									) : null}
								</div>
								{selectedInvestorDetail.sumsubStatus !== 'approved' ? (
									<p className="mt-3 text-sm text-[#5F6C86]">
										Approve Access remains disabled until Sumsub is approved.
									</p>
								) : null}
							</div>
						) : null}
					</div>
				</div>
			) : null}

			<BaseModal
				title={
					overrideModal.mode === 'enable'
						? 'Set Testnet Override'
						: 'Set Standard Verification'
				}
				dataTest="investor-test-override-modal"
				isOpen={overrideModal.isOpen}
				closeModal={closeOverrideModal}
				submitButton={{
					text:
						overrideModal.mode === 'enable'
							? 'Set Testnet Override'
							: 'Set Standard Verification',
					loadingText:
						overrideModal.mode === 'enable'
							? 'Applying override...'
							: 'Disabling override...',
					onClick: () => void submitTestOverride(),
					isLoading:
						Boolean(overrideModal.userId) &&
						processingUserId === overrideModal.userId,
				}}
				closeButtonDisabled={
					Boolean(overrideModal.userId) &&
					processingUserId === overrideModal.userId
				}
			>
				<div className="space-y-4">
					<p className="text-sm leading-6 text-[#5F6C86]">
						{overrideModal.mode === 'enable'
							? `Enable the temporary testnet verification override for ${overrideModal.investorLabel}.`
							: `Return ${overrideModal.investorLabel} to the standard verification path.`}
					</p>
					<div className="rounded-[16px] border border-[#F2C6C6] bg-[#FEF3F3] px-4 py-3">
						<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D14343]">
							Warning
						</p>
						<p className="mt-2 text-sm leading-6 text-[#B42318]">
							This is a non-production testing override only. It does not
							replace real compliance approval.
						</p>
					</div>
					{overrideError ? (
						<div
							className="rounded-[16px] border border-[#F2C6C6] bg-[#FEF3F3] px-4 py-3 text-sm text-[#B42318]"
							data-test="investor-test-override-modal-error"
						>
							{overrideError}
						</div>
					) : null}
					<div>
						<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Note
						</label>
						<textarea
							value={overrideNote}
							onChange={(event) => setOverrideNote(event.target.value)}
							className="min-h-[120px] w-full rounded-[16px] border border-[#E7ECF4] bg-white px-4 py-3 text-sm text-[#163F74] outline-none"
							placeholder="Why is this override being enabled or disabled?"
							disabled={
								Boolean(overrideModal.userId) &&
								processingUserId === overrideModal.userId
							}
							data-test="investor-test-override-modal-note"
						/>
					</div>
				</div>
			</BaseModal>
		</div>
	);
}
