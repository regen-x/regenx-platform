import {
	AlertCircle,
	BadgeCheck,
	CreditCard,
	Filter,
	Search,
	UserCheck,
	WalletCards,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TokenLink from '@/components/common/TokenLink';
import NotificationBell from '@/components/notifications/NotificationBell';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useOwnershipHoldings } from '@/hooks/useOwnershipHoldings';
import {
	IDistribution,
	IDistributionSummary,
} from '@/interfaces/api/IDistribution';
import { IOrder, IOrderSummary } from '@/interfaces/api/IOrder';
import { IProject } from '@/interfaces/api/IProject';
import { distributionService } from '@/services/distribution.service';
import { orderService } from '@/services/order.service';
import { projectService } from '@/services/project.service';
import { useUserStore } from '@/store/user.store';
import { offHoldingsUpdated, onHoldingsUpdated } from '@/utils/events';

type InvestorHolding = {
	id: string;
	projectId: number;
	name: string;
	status: 'Live';
	tokenSymbol: string;
	assetCode?: string;
	assetIssuer?: string | null;
	projectStatus?: string;
	custodyType: 'self_custody' | 'regenx_custody';
	ownershipSource?: 'ON_CHAIN' | 'INTERNAL_LEDGER';
	settlementStatus?:
		| 'PENDING'
		| 'SUBMITTED'
		| 'SETTLED'
		| 'FAILED'
		| 'CANCELLED';
	amountHeld: number;
	estimatedValue: number | null;
	custodyLabel: string;
	thumbnailUrl: string;
};

type DashboardOpportunity = IProject & {
	id?: string;
	status?: IProject['status'];
	payloadJson?: Record<string, unknown>;
};

function formatUnits(value: number) {
	return value.toLocaleString();
}

function money(value?: number | null, currency = 'AUD') {
	return value == null || Number.isNaN(Number(value))
		? 'Unavailable'
		: new Intl.NumberFormat('en-AU', {
				style: 'currency',
				currency,
				maximumFractionDigits: 2,
		  }).format(Number(value));
}

function percent(value?: number | null) {
	return value == null || Number.isNaN(Number(value))
		? 'Pending'
		: `${Number(value).toFixed(2)}%`;
}

function formatDate(value?: string | null, emptyLabel = 'Unavailable') {
	return value ? new Date(value).toLocaleDateString() : emptyLabel;
}

function formatPlainMoney(value?: number | string | null) {
	const normalized = value == null ? null : Number(value);
	if (normalized == null || Number.isNaN(normalized)) return 'Unavailable';
	return money(normalized);
}

function formatStatusLabel(value?: string | null) {
	return String(value || 'pending')
		.replaceAll('_', ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProjectPayload(project: DashboardOpportunity) {
	const payload = (project.payloadJson || project.draftPayload || {}) as Record<
		string,
		any
	>;
	return (payload.form || payload) as Record<string, any>;
}

function getProjectValue(
	project: DashboardOpportunity,
	keys: string[],
	fallback = 'Unavailable',
) {
	const payload = getProjectPayload(project);
	for (const key of keys) {
		const value = payload[key] ?? (project as Record<string, any>)[key];
		if (value !== undefined && value !== null && value !== '') {
			return String(value);
		}
	}
	return fallback;
}

function getGreeting() {
	const hour = new Date().getHours();

	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

function getHoldingThumbnail(name: string) {
	const normalized = String(name || '').toLowerCase();

	if (
		normalized.includes('eliot') ||
		normalized.includes('battery') ||
		normalized.includes('bess')
	) {
		return '/images/eliot.jpg';
	}

	if (normalized.includes('solar')) {
		return 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1600&auto=format&fit=crop';
	}

	if (normalized.includes('ev')) {
		return '/images/eliot.jpg';
	}

	return 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1600&auto=format&fit=crop';
}

function InvestorKpiCard({
	title,
	value,
	subtitle,
	accent = 'blue',
}: {
	title: string;
	value: string | number;
	subtitle: string;
	accent?: 'blue' | 'pink' | 'neutral';
}) {
	const styles =
		accent === 'pink'
			? 'theme-surface-muted'
			: accent === 'blue'
			? 'theme-surface-muted'
			: 'theme-surface';

	const valueColor =
		accent === 'pink' ? 'theme-text-secondary' : 'theme-heading';
	const valueLabel = String(value);
	const valueSizeClass =
		valueLabel.length > 14
			? 'text-[18px] leading-tight'
			: 'text-[21px] leading-none';

	return (
		<div
			className={`rounded-[18px] border px-5 py-4 shadow-[var(--shadow-soft)] ${styles}`}
		>
			<div className="theme-text-secondary text-[13px] font-semibold uppercase tracking-[0.12em]">
				{title}
			</div>
			<div className={`mt-2 font-semibold ${valueSizeClass} ${valueColor}`}>
				{value}
			</div>
			<div className="theme-text-secondary mt-2 whitespace-pre-line text-[13px] leading-[1.4]">
				{subtitle}
			</div>
		</div>
	);
}

function CustodyPill() {
	return (
		<span className="rounded-full border border-[#D9E4F6] bg-[#F4F8FF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2F5EA8]">
			Platform Managed
		</span>
	);
}

function InvestmentCard({
	holding,
	isSelected,
	onSelect,
	onView,
}: {
	holding: InvestorHolding;
	isSelected: boolean;
	onSelect: () => void;
	onView: () => void;
}) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onSelect}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					onSelect();
				}
			}}
			className={`theme-surface overflow-hidden rounded-[18px] border transition ${
				isSelected
					? 'border-[#2F80ED] shadow-[0_10px_24px_rgba(47,128,237,0.18)]'
					: 'border-[var(--border-color)] hover:border-[#BFD3F2]'
			}`}
		>
			<div className="relative h-[160px] w-full overflow-hidden bg-[#EEF4FB]">
				<img
					src={holding.thumbnailUrl}
					alt={holding.name}
					className="h-full w-full object-cover"
					onError={(e) => {
						(e.currentTarget as HTMLImageElement).src = '/images/eliot.jpg';
					}}
				/>

				<div className="absolute left-4 top-4 flex items-center justify-between gap-2">
					<span className="rounded-full border border-[#D7E6FB] bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2F5EA8]">
						Investment
					</span>
					<span className="rounded-full border border-[#CDECD7] bg-[#EAF8EF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2E8B57]">
						Live
					</span>
					{isSelected ? (
						<span className="rounded-full border border-[#BFD3F2] bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1F5AA6]">
							Selected
						</span>
					) : null}
				</div>
			</div>

			<div className="p-5">
				<h3 className="theme-heading text-[18px] font-semibold tracking-[-0.02em]">
					{holding.name}
				</h3>

				<div className="mt-3 flex flex-wrap items-center gap-2">
					<span className="rounded-[8px] bg-[#EAF2FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2F5EA8]">
						<TokenLink
							assetCode={holding.assetCode}
							assetIssuer={holding.assetIssuer}
							status={holding.projectStatus}
							className="hover:underline"
						>
							{holding.tokenSymbol}
						</TokenLink>
					</span>
					<CustodyPill />
				</div>

				<div className="mt-5 grid grid-cols-2 gap-4">
					<div>
						<div className="theme-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
							Units Held
						</div>
						<div className="theme-heading mt-1 text-[15px] font-semibold">
							{formatUnits(holding.amountHeld)}
						</div>
					</div>

					<div>
						<div className="theme-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
							Portfolio Share
						</div>
						<div className="theme-heading mt-1 text-[15px] font-semibold">
							{holding.estimatedValue != null
								? money(holding.estimatedValue)
								: 'Select to view'}
						</div>
					</div>
				</div>

				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						onView();
					}}
					className="theme-button-secondary mt-5 w-full rounded-[10px] border px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition"
				>
					View Investment
				</button>
			</div>
		</div>
	);
}

function SidePanelItem({
	title,
	subtitle,
	value,
	barClass,
}: {
	title: string;
	subtitle: string;
	value: string;
	barClass: string;
}) {
	return (
		<div className="theme-surface-muted rounded-[12px] border px-4 py-4 shadow-[var(--shadow-soft)]">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-2.5">
					<div className={`mt-0.5 h-10 w-[4px] rounded-full ${barClass}`} />
					<div>
						<div className="theme-heading text-[14px] font-semibold">
							{title}
						</div>
						<div className="theme-text-secondary mt-0.5 text-[12px]">
							{subtitle}
						</div>
					</div>
				</div>
				<div
					className={`theme-heading max-w-[112px] shrink-0 text-right font-semibold leading-snug tracking-[-0.02em] ${
						String(value).length > 10
							? 'text-[14px] md:text-[15px]'
							: 'text-[16px] md:text-[18px]'
					}`}
				>
					{value}
				</div>
			</div>
		</div>
	);
}

function OrderBadge({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-[12px] border border-[#E7ECF4] bg-[#F9FBFE] px-4 py-3">
			<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
				{label}
			</div>
			<div className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#163F74]">
				{value}
			</div>
		</div>
	);
}

function OrderStatusPill({ status }: { status: string }) {
	const tone =
		status === 'FAILED'
			? 'border-[#F3C2CF] bg-[#FFF1F3] text-[#C01048]'
			: status === 'COMPLETED'
			? 'border-[#C9D7FF] bg-[#EEF4FF] text-[#3157D6]'
			: 'border-[#D9E2EF] bg-white text-[#163F74]';

	return (
		<span
			className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${tone}`}
		>
			{status.replaceAll('_', ' ')}
		</span>
	);
}

function StatusBadge({
	label,
	tone = 'neutral',
}: {
	label: string;
	tone?: 'red' | 'neutral' | 'blue';
}) {
	const toneClass =
		tone === 'red'
			? 'border-[#F2B8B8] bg-[#FFF4F4] text-[#B42318]'
			: tone === 'blue'
			? 'border-[#C9D7FF] bg-[#EEF4FF] text-[#3157D6]'
			: 'border-[#D9E2EF] bg-white text-[#5F6C86]';

	return (
		<span
			className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass}`}
		>
			{label}
		</span>
	);
}

function AccountStatusRow({
	icon,
	title,
	helper,
	status,
	isBlocked,
	action,
	onAction,
}: {
	icon: ReactNode;
	title: string;
	helper: string;
	status: string;
	isBlocked: boolean;
	action: string;
	onAction: () => void;
}) {
	return (
		<div className="rounded-[14px] border border-[#E7ECF4] bg-[#F9FBFE] px-3 py-3">
			<div className="grid grid-cols-[32px_minmax(118px,1fr)_auto_auto] items-center gap-3">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2FF] text-[#2F80ED]">
					{icon}
				</div>
				<div className="min-w-0">
					<h3 className="truncate text-[13px] font-semibold text-[#163F74]">
						{title}
					</h3>
					<p className="truncate text-[12px] text-[#5F6C86]">{helper}</p>
				</div>
				<StatusBadge label={status} tone={isBlocked ? 'red' : 'neutral'} />
				<button
					type="button"
					onClick={onAction}
					className="rounded-[10px] border border-[#D9E2EF] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#163F74]"
				>
					{action}
				</button>
			</div>
		</div>
	);
}

function PortfolioAllocationChart({
	data,
	totalValue,
}: {
	data: Array<{ name: string; value: number; percent: number }>;
	totalValue: number;
}) {
	const hasAllocation = data.length > 0 && totalValue > 0;
	const centerPercent = hasAllocation
		? `${Math.round(Math.max(...data.map((item) => item.percent)))}%`
		: '0%';
	const colors = ['#FFFFFF', '#DCEBFF', '#BFD7FF', '#8FB7F4', '#6B9BF0'];
	const gradient = hasAllocation
		? data
				.reduce(
					(acc, item, index) => {
						const start = acc.cursor;
						const end = start + item.percent * 3.6;

						return {
							cursor: end,
							segments: [
								...acc.segments,
								`${colors[index % colors.length]} ${start}deg ${end}deg`,
							],
						};
					},
					{ cursor: 0, segments: [] as string[] },
				)
				.segments.join(', ')
		: 'rgba(255,255,255,0.35) 0deg 360deg';

	return (
		<div className="rounded-[18px] border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm">
			<div className="flex flex-col items-center">
				<div className="relative flex h-[220px] w-full items-center justify-center">
					<div
						className="h-[192px] w-[192px] rounded-full"
						style={{ background: `conic-gradient(${gradient})` }}
					/>
					<div className="absolute h-[124px] w-[124px] rounded-full bg-[#1E5BAA]" />
					<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
						<div className="text-[34px] font-semibold tracking-[-0.03em] text-white">
							{centerPercent}
						</div>
					</div>
				</div>
				<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#DCEEFF]">
					Portfolio Allocated
				</div>
				<div className="mt-1 text-[13px] font-semibold text-white">
					{money(totalValue)} of total portfolio
				</div>
			</div>
		</div>
	);
}

export default function InvestorDashboard() {
	const navigate = useNavigate();
	const { user, onboarding } = useUserStore();
	const [distributionSummary, setDistributionSummary] =
		useState<IDistributionSummary | null>(null);
	const [recentDistributions, setRecentDistributions] = useState<
		IDistribution[]
	>([]);
	const [orderSummary, setOrderSummary] = useState<IOrderSummary | null>(null);
	const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
	const [opportunities, setOpportunities] = useState<DashboardOpportunity[]>(
		[],
	);
	const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(true);
	const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(
		null,
	);

	const { rows, isLoading, refreshHoldings } = useOwnershipHoldings();

	useEffect(() => {
		const handler = () => refreshHoldings();

		onHoldingsUpdated(handler);

		return () => {
			offHoldingsUpdated(handler);
		};
	}, [refreshHoldings]);

	useEffect(() => {
		const loadDistributionData = async () => {
			try {
				const [summary, records] = await Promise.all([
					distributionService.getMySummary(),
					distributionService.getMyDistributions(),
				]);

				setDistributionSummary(summary || null);
				setRecentDistributions(
					Array.isArray(records) ? records.slice(0, 5) : [],
				);
			} catch (error) {
				console.error('Failed to load distribution summary', error);
				setDistributionSummary(null);
				setRecentDistributions([]);
			}
		};

		void loadDistributionData();
	}, []);

	useEffect(() => {
		const loadOrderData = async () => {
			try {
				const summary = await orderService.getMySummary();
				setOrderSummary(summary || null);
				setRecentOrders(
					Array.isArray(summary?.recent) ? summary.recent.slice(0, 5) : [],
				);
			} catch (error) {
				console.error('Failed to load order summary', error);
				setOrderSummary(null);
				setRecentOrders([]);
			}
		};

		void loadOrderData();
	}, []);

	useEffect(() => {
		const loadOpportunities = async () => {
			try {
				setIsLoadingOpportunities(true);
				const res = await projectService.getProjects();
				const data = Array.isArray(res) ? res : [];
				const visibleProjects = data.filter((project: DashboardOpportunity) =>
					['approved', 'issued', 'live'].includes(
						String(project.status || '').toLowerCase(),
					),
				);
				setOpportunities(visibleProjects.slice(0, 5));
			} catch (error) {
				console.error('Failed to load dashboard opportunities', error);
				setOpportunities([]);
			} finally {
				setIsLoadingOpportunities(false);
			}
		};

		void loadOpportunities();
	}, []);

	const holdings = useMemo<InvestorHolding[]>(() => {
		return rows.map((row, index) => {
			const amountHeld = Number(row.totalTokens || 0);
			const projectName = row.projectName || `Project ${row.projectId}`;
			const tokenPrice = Number(row.tokenPrice || 0);
			const totalValue = Number(row.totalValue || 0);
			const estimatedValue =
				totalValue > 0
					? totalValue
					: tokenPrice > 0
					? amountHeld * tokenPrice
					: null;

			return {
				id: `${row.projectId}-${row.seriesId}-${row.tokenSymbol}-${index}`,
				projectId: Number(row.projectId),
				name: projectName,
				status: 'Live',
				tokenSymbol: row.tokenSymbol || 'TOKEN',
				assetCode: row.assetCode || row.tokenSymbol || 'TOKEN',
				assetIssuer: row.assetIssuer || row.issuer || null,
				projectStatus: row.projectStatus || row.status || 'live',
				custodyType: row.custodyType,
				amountHeld,
				estimatedValue,
				custodyLabel: 'Managed by RegenX',
				thumbnailUrl: getHoldingThumbnail(projectName),
			};
		});
	}, [rows]);

	useEffect(() => {
		if (!holdings.length) {
			setSelectedHoldingId(null);
			return;
		}

		setSelectedHoldingId((current) =>
			current && holdings.some((holding) => holding.id === current)
				? current
				: holdings[0].id,
		);
	}, [holdings]);

	const selectedHolding = useMemo(
		() =>
			holdings.find((holding) => holding.id === selectedHoldingId) ??
			holdings[0] ??
			null,
		[holdings, selectedHoldingId],
	);

	const portfolioAllocation = useMemo(() => {
		const allocationRows = holdings
			.map((holding) => ({
				name: holding.name,
				value: Math.max(Number(holding.estimatedValue || 0), 0),
			}))
			.filter((holding) => holding.value > 0);
		const totalValue = allocationRows.reduce(
			(sum, holding) => sum + holding.value,
			0,
		);

		return {
			totalValue,
			data:
				totalValue > 0
					? allocationRows.map((holding) => ({
							...holding,
							percent: (holding.value / totalValue) * 100,
					  }))
					: [],
		};
	}, [holdings]);

	const accountStatusRows = useMemo(() => {
		const kycComplete =
			onboarding?.identityStatus === 'verified' &&
			onboarding?.amlStatus === 'verified';
		const accreditedComplete =
			onboarding?.wholesaleStatus === 'verified' ||
			onboarding?.investorCategory === 'wholesale' ||
			onboarding?.investorCategory === 'sophisticated';
		const custodyComplete = holdings.some(
			(holding) => holding.custodyType === 'regenx_custody',
		);
		const fundingComplete = Boolean(onboarding?.bankAccountVerified);

		return [
			{
				key: 'kyc',
				title: 'KYC Verification',
				helper: 'Identity & AML required',
				status: kycComplete ? 'Verified' : 'Incomplete',
				isBlocked: !kycComplete,
				action: 'Complete',
				route: '/account-verification',
				icon: <UserCheck className="h-4 w-4" />,
			},
			{
				key: 'accredited',
				title: 'Accredited Investor',
				helper: 'Investor eligibility pending',
				status: accreditedComplete ? 'Verified' : 'Documents Pending',
				isBlocked: !accreditedComplete,
				action: 'Review',
				route: '/account-verification',
				icon: <BadgeCheck className="h-4 w-4" />,
			},
			{
				key: 'custody',
				title: 'Custody Account',
				helper: 'Custody setup required',
				status: custodyComplete ? 'Set Up' : 'Not Set Up',
				isBlocked: !custodyComplete,
				action: 'Set Up',
				route: '/account-verification',
				icon: <WalletCards className="h-4 w-4" />,
			},
			{
				key: 'funding',
				title: 'Funding Source',
				helper: 'Add funding account',
				status: fundingComplete ? 'Added' : 'Not Added',
				isBlocked: !fundingComplete,
				action: 'Add Funds',
				route: '/cash-account',
				icon: <CreditCard className="h-4 w-4" />,
			},
		];
	}, [holdings, onboarding]);

	const actionBlockers = useMemo(
		() =>
			[
				accountStatusRows.find((row) => row.key === 'kyc')?.isBlocked
					? 'KYC incomplete'
					: '',
				accountStatusRows.find((row) => row.key === 'custody')?.isBlocked
					? 'Custody account not set up'
					: '',
				accountStatusRows.find((row) => row.key === 'funding')?.isBlocked
					? 'Funding source missing'
					: '',
				accountStatusRows.find((row) => row.key === 'accredited')?.isBlocked
					? 'Documents pending'
					: '',
			].filter(Boolean),
		[accountStatusRows],
	);

	const incomeSection = useMemo(() => {
		const lastDistribution = distributionSummary?.lastDistribution;

		return {
			totalIncomeReceived: distributionSummary?.totalIncomeReceived ?? 0,
			lastDistribution,
			nextExpectedDistributionDate:
				distributionSummary?.nextExpectedDistributionDate ?? null,
			estimatedAnnualYield: distributionSummary?.currentYieldEstimate ?? null,
		};
	}, [distributionSummary]);

	const displayName = user?.fullName || 'Investor';

	return (
		<div
			className="theme-page-shell min-h-full w-full bg-[#F7F8FB] px-4 py-4"
			data-test="investor-dashboard"
		>
			<div className="w-full max-w-[1220px]">
				<div className="theme-border mb-4 flex items-start justify-between border-b pb-4">
					<div>
						<div className="theme-eyebrow inline-flex rounded-[8px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
							Investor Portal
						</div>

						<h1 className="theme-heading mt-3 text-[34px] font-semibold tracking-[-0.03em]">
							{getGreeting()}, {displayName}
						</h1>

						<p className="theme-text-secondary mt-2 text-[15px] leading-[1.4]">
							Track your capital, custody positions, and live holdings.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<ThemeToggle />
						<button
							type="button"
							onClick={() => navigate('/support')}
							className="theme-button-secondary rounded-[12px] border px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.08em]"
						>
							Report an Issue
						</button>
						<div className="theme-input flex h-[46px] w-[286px] items-center gap-2 rounded-[12px] border px-4 shadow-[var(--shadow-soft)]">
							<Search className="theme-text-muted h-4 w-4" />
							<input
								type="text"
								placeholder="Search assets..."
								className="theme-text w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--text-muted)]"
							/>
						</div>

						<NotificationBell />
					</div>
				</div>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
					<InvestorKpiCard
						title="Total Invested"
						value={money(distributionSummary?.portfolioEstimatedValue ?? null)}
						subtitle="Estimated from current project token prices"
						accent="neutral"
					/>
					<InvestorKpiCard
						title="Total Value (NAV)"
						value={money(distributionSummary?.totalIncomeReceived ?? 0)}
						subtitle="Net paid distributions across your holdings"
						accent="neutral"
					/>
					<InvestorKpiCard
						title="Total Distributions"
						value={money(distributionSummary?.pendingIncome ?? 0)}
						subtitle="Scheduled and pending income not yet settled"
						accent="neutral"
					/>
					<InvestorKpiCard
						title="Net Annualised Yield (%)"
						value={percent(
							distributionSummary?.averageYieldAcrossHoldings ?? null,
						)}
						subtitle="Estimated using trailing income over settled invested capital"
						accent="pink"
					/>
				</div>

				<div className="mt-4 rounded-[18px] border border-[#F2B8B8] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex items-start gap-3">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF4F4] text-[#B42318]">
								<AlertCircle className="h-4 w-4" />
							</div>
							<div>
								<h2 className="text-[16px] font-semibold text-[#163F74]">
									Action Required
								</h2>
								<p className="mt-0.5 text-[12px] leading-5 text-[#5F6C86]">
									Complete the items below before investing or settling new
									orders.
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={() => navigate('/account-verification')}
							className="rounded-[12px] bg-[#184F9E] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(47,128,237,0.14)]"
						>
							Complete Verification
						</button>
					</div>

					{actionBlockers.length ? (
						<div className="mt-2 flex flex-wrap gap-2">
							{actionBlockers.map((blocker) => (
								<StatusBadge key={blocker} label={blocker} tone="red" />
							))}
						</div>
					) : null}
				</div>

				<div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
					<div className="min-w-0 space-y-5">
						<div className="theme-dashboard-hero overflow-hidden rounded-[18px] border px-5 py-5 shadow-[0_6px_16px_rgba(47,128,237,0.14)]">
							<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
								<div>
									<div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#DCEEFF]">
										Portfolio Overview
									</div>
									<div className="mt-2 max-w-[560px] text-[34px] font-semibold leading-[1.02] tracking-[-0.03em]">
										Track settled positions and portfolio activity in one place
									</div>
									<div className="mt-3 max-w-[540px] text-[15px] leading-[1.55] text-[#EAF5FF]">
										Review your live holdings, stay on top of distribution
										activity, and move quickly between opportunities and your
										portfolio.
									</div>
									<div className="mt-5 flex flex-wrap gap-3">
										<button
											type="button"
											onClick={() => navigate('/opportunities')}
											className="rounded-[14px] bg-white px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1E4E9C] shadow-[0_8px_18px_rgba(255,255,255,0.14)]"
										>
											Browse Opportunities
										</button>
										<button
											type="button"
											onClick={() => navigate('/portfolio')}
											className="rounded-[14px] border border-white/25 bg-white/10 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm"
										>
											View Portfolio
										</button>
									</div>
								</div>

								<PortfolioAllocationChart
									data={portfolioAllocation.data}
									totalValue={portfolioAllocation.totalValue}
								/>
							</div>
						</div>
					</div>

					<div className="space-y-5">
						<div className="rounded-[18px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							<h2 className="text-[18px] font-semibold text-[#163F74]">
								Accounts & Status
							</h2>
							<p className="mt-1 text-[13px] leading-5 text-[#5F6C86]">
								Resolve blockers before funding or settling an investment.
							</p>
							<div className="mt-4 space-y-3">
								{accountStatusRows.map((row) => (
									<AccountStatusRow
										key={row.key}
										icon={row.icon}
										title={row.title}
										helper={row.helper}
										status={row.status}
										isBlocked={row.isBlocked}
										action={row.action}
										onAction={() => navigate(row.route)}
									/>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="mt-5 rounded-[18px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h2 className="text-[18px] font-semibold text-[#163F74]">
								Live Opportunities
							</h2>
							<p className="mt-1 text-[13px] text-[#5F6C86]">
								Current approved, issued, or live projects available for review.
							</p>
						</div>
						<button
							type="button"
							onClick={() => navigate('/opportunities')}
							className="rounded-[12px] border border-[#D9E2EF] px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#163F74]"
						>
							View All
						</button>
					</div>

					<div className="mt-4 overflow-x-auto">
						{isLoadingOpportunities ? (
							<div className="rounded-[14px] border border-dashed border-[#D9E3F0] bg-[#FAFBFD] px-4 py-6 text-sm text-[#5F6C86]">
								Loading opportunities...
							</div>
						) : opportunities.length === 0 ? (
							<div className="rounded-[14px] border border-dashed border-[#D9E3F0] bg-[#FAFBFD] px-4 py-6 text-sm text-[#5F6C86]">
								No live opportunities are available yet.
							</div>
						) : (
							<table className="min-w-full border-separate border-spacing-y-2 text-left">
								<thead>
									<tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A96AA]">
										<th className="px-3 py-2">Project</th>
										<th className="px-3 py-2">Asset Type</th>
										<th className="px-3 py-2">Location</th>
										<th className="px-3 py-2">Target Yield</th>
										<th className="px-3 py-2">Min Investment</th>
										<th className="px-3 py-2">Status</th>
										<th className="px-3 py-2">Action</th>
									</tr>
								</thead>
								<tbody>
									{opportunities.map((project) => (
										<tr
											key={project.id}
											className="rounded-[14px] bg-[#F9FBFE] text-sm text-[#1B2F56]"
										>
											<td className="rounded-l-[14px] px-3 py-3 font-semibold">
												{project.name || `Project ${project.id}`}
											</td>
											<td className="px-3 py-3">
												{getProjectValue(project, ['projectType', 'assetType'])}
											</td>
											<td className="px-3 py-3">
												{getProjectValue(project, [
													'location',
													'siteAddress',
													'jurisdiction',
												])}
											</td>
											<td className="px-3 py-3">
												{getProjectValue(project, [
													'targetAnnualYield',
													'targetIrr',
												])}
											</td>
											<td className="px-3 py-3">
												{formatPlainMoney(
													getProjectValue(
														project,
														['minimumInvestment', 'minInvestment'],
														'',
													),
												)}
											</td>
											<td className="px-3 py-3">
												<StatusBadge
													label={formatStatusLabel(project.status)}
													tone="neutral"
												/>
											</td>
											<td className="rounded-r-[14px] px-3 py-3">
												<button
													type="button"
													onClick={() =>
														navigate(`/opportunities/${project.id}`)
													}
													className="rounded-[10px] bg-[#184F9E] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
												>
													View Details
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				<div className="mt-5 theme-surface rounded-[18px] border p-5 shadow-[var(--shadow-soft)]">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h2 className="theme-heading text-[18px] font-semibold">
								Income & Yield
							</h2>
							<p className="theme-text-secondary mt-1 text-[13px]">
								Estimated yield is based on trailing income over settled
								invested capital.
							</p>
						</div>
						<button
							type="button"
							onClick={() => navigate('/distributions')}
							className="theme-button-secondary rounded-[12px] border px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em]"
						>
							View All
						</button>
					</div>

					<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
						<SidePanelItem
							title="Total income received"
							subtitle="Net paid distributions across all holdings"
							value={money(incomeSection.totalIncomeReceived)}
							barClass="bg-[#2F80ED]"
						/>
						<SidePanelItem
							title="Last distribution"
							subtitle={
								incomeSection.lastDistribution?.projectName ||
								'No paid distributions yet'
							}
							value={
								incomeSection.lastDistribution
									? money(
											incomeSection.lastDistribution.netAmount,
											incomeSection.lastDistribution.currency,
									  )
									: '—'
							}
							barClass="bg-[#2F80ED]"
						/>
						<SidePanelItem
							title="Next expected"
							subtitle="Earliest scheduled or pending distribution date"
							value={formatDate(
								incomeSection.nextExpectedDistributionDate,
								'TBD',
							)}
							barClass="bg-[#2F80ED]"
						/>
						<SidePanelItem
							title="Estimated annual yield"
							subtitle="Portfolio-level estimate from settled income"
							value={percent(incomeSection.estimatedAnnualYield)}
							barClass="bg-[#2F80ED]"
						/>
					</div>

					<div className="mt-5 rounded-[14px] border border-[#E7ECF4] bg-[#F9FBFE] p-4">
						<div className="flex items-center justify-between gap-3">
							<h3 className="text-[15px] font-semibold text-[#163F74]">
								Recent Distributions
							</h3>
							<button
								type="button"
								onClick={() => navigate('/distributions')}
								className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#184F9E]"
							>
								View all
							</button>
						</div>
						<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
							{recentDistributions.slice(0, 4).map((item) => (
								<div
									key={`${item.id}-${item.createdAt}`}
									className="flex items-start gap-3 rounded-[12px] bg-white px-3 py-3"
								>
									<span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#1D4FA3]" />
									<div className="min-w-0">
										<div className="truncate text-[13px] font-semibold text-[#1B2F56]">
											{item.projectName || `Project ${item.projectId}`}
										</div>
										<div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[#8B98AF]">
											{formatDate(item.distributionDate)} • {item.status}
										</div>
										<div className="mt-1 text-[13px] font-semibold text-[#1B2F56]">
											{money(item.netAmount, item.currency)}
										</div>
									</div>
								</div>
							))}
							{recentDistributions.length === 0 ? (
								<div className="text-[13px] text-[#5F6C86]">
									No recent distributions recorded yet.
								</div>
							) : null}
						</div>
					</div>
				</div>

				<div className="mt-3 rounded-[18px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h2 className="text-[18px] font-semibold text-[#163F74]">
								Recent Order Activity
							</h2>
							<p className="mt-1 text-[13px] text-[#66748E]">
								Track pending, settling, completed, and failed investment orders
								after you click Invest.
							</p>
						</div>
						<button
							type="button"
							onClick={() => navigate('/orders')}
							className="rounded-[12px] border border-[#D9E2EF] px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#163F74]"
						>
							View Orders
						</button>
					</div>

					<div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
						<OrderBadge
							label="Pending"
							value={Number(orderSummary?.pendingCount ?? 0)}
						/>
						<OrderBadge
							label="Settling"
							value={Number(orderSummary?.settlingCount ?? 0)}
						/>
						<OrderBadge
							label="Completed"
							value={Number(orderSummary?.completedCount ?? 0)}
						/>
						<OrderBadge
							label="Failed"
							value={Number(orderSummary?.failedCount ?? 0)}
						/>
					</div>

					<div className="mt-5">
						{recentOrders.length === 0 ? (
							<div className="rounded-[14px] border border-dashed border-[#D9E3F0] bg-[#FAFBFD] px-4 py-6 text-sm text-[#66748E]">
								No order activity recorded yet.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full border-separate border-spacing-y-3">
									<thead>
										<tr className="text-left text-sm text-[#8B98AF]">
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
												Status
											</th>
											<th className="pb-2 font-medium uppercase tracking-[0.08em]">
												Last Updated
											</th>
										</tr>
									</thead>
									<tbody>
										{recentOrders.map((order) => (
											<tr
												key={order.id}
												className="rounded-[18px] border border-[#E7ECF4] bg-[#F9FBFE] text-sm text-[#1B2F56]"
											>
												<td className="rounded-l-[18px] px-4 py-4 font-semibold">
													{order.projectName}
												</td>
												<td className="px-4 py-4">{order.orderType}</td>
												<td className="px-4 py-4 font-semibold">
													{money(order.currencyAmount)}
												</td>
												<td className="px-4 py-4">
													<OrderStatusPill status={order.status} />
												</td>
												<td className="rounded-r-[18px] px-4 py-4 text-[#66748E]">
													{new Date(order.updatedAt).toLocaleString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				<div className="mt-4">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="theme-heading text-[18px] font-semibold">
							My Active Investments
						</h2>

						<div className="flex items-center gap-2">
							<button
								type="button"
								className="theme-button-secondary inline-flex items-center gap-2 rounded-[12px] border px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] shadow-[var(--shadow-soft)]"
							>
								<Filter className="h-3.5 w-3.5" />
								Filter
							</button>

							<button
								type="button"
								onClick={() => navigate('/portfolio')}
								className="rounded-[14px] bg-[#184F9E] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(47,128,237,0.14)]"
							>
								Portfolio
							</button>
						</div>
					</div>

					{isLoading ? (
						<div className="rounded-[18px] border border-[#E7ECF4] bg-white px-5 py-8 text-sm text-[#66748E] shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							Loading holdings...
						</div>
					) : holdings.length === 0 ? (
						<div className="rounded-[18px] border border-[#E7ECF4] bg-white px-5 py-8 text-sm text-[#66748E] shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							No live holdings yet. Browse opportunities to make your first
							allocation.
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
							{holdings.map((holding) => (
								<InvestmentCard
									key={holding.id}
									holding={holding}
									isSelected={holding.id === selectedHolding?.id}
									onSelect={() => setSelectedHoldingId(holding.id)}
									onView={() => navigate('/portfolio')}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
