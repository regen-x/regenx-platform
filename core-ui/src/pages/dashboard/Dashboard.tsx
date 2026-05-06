import { useEffect } from 'react';
import { useMemo, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';

import { AdminPageHeader, AdminStatusBadge } from '@/components/admin-ui';
import DashboardClientsCard from '@/components/dashboard/(wealth-manager)/clients/card';
import {
	TransactionStatusLabels,
	TransactionType,
	TransactionTypeLabels,
} from '@/constants/enum/transaction-type.enum';
import { UserType } from '@/constants/enum/user-type.enum';
import { PATHS } from '@/constants/routes/paths';
import { ITransaction } from '@/interfaces/api/ITransaction';
import InvestorDashboard from '@/pages/dashboard/InvestorDashboard';
import { projectService } from '@/services/project.service';
import { transactionService } from '@/services/transaction.service';
import { useUserStore } from '@/store/user.store';

type ClimateProject = {
	id: string;
	uuid?: string;
	name: string;
	statusLabel: string;
	backendStatus:
		| 'draft'
		| 'under_review'
		| 'changes_requested'
		| 'approved'
		| 'issued'
		| 'live'
		| 'locked';
	fundingGoal: number;
	settledCapital: number;
	investorCount: number;
	completionLabel: string;
	lifecycleNote: string;
	progressPct: number;
	nextActionLabel: string;
};

const getPct = (goal: number, raised: number) =>
	goal > 0 ? Math.max(0, Math.min(100, Math.round((raised / goal) * 100))) : 0;

const money = (value?: number | null) =>
	value == null || Number.isNaN(Number(value))
		? '—'
		: new Intl.NumberFormat('en-AU', {
				style: 'currency',
				currency: 'AUD',
				maximumFractionDigits: 0,
		  }).format(Number(value));

const formatDateTime = (value?: string | null) =>
	value ? new Date(value).toLocaleString() : '—';

function usePrefersReducedMotion() {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleChange = () => {
			setPrefersReducedMotion(mediaQuery.matches);
		};

		handleChange();
		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	}, []);

	return prefersReducedMotion;
}

function useAnimatedNumber(target: number, duration = 850) {
	const prefersReducedMotion = usePrefersReducedMotion();
	const safeTarget = Number.isFinite(target) ? target : 0;
	const [value, setValue] = useState(prefersReducedMotion ? safeTarget : 0);

	useEffect(() => {
		if (prefersReducedMotion) {
			setValue(safeTarget);
			return;
		}

		let frameId = 0;
		let startTime: number | null = null;

		const tick = (timestamp: number) => {
			if (startTime == null) startTime = timestamp;
			const elapsed = timestamp - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const easedProgress = 1 - Math.pow(1 - progress, 3);

			setValue(safeTarget * easedProgress);

			if (progress < 1) {
				frameId = window.requestAnimationFrame(tick);
			}
		};

		setValue(0);
		frameId = window.requestAnimationFrame(tick);

		return () => {
			window.cancelAnimationFrame(frameId);
		};
	}, [duration, prefersReducedMotion, safeTarget]);

	return value;
}

type InvestorSummary = {
	project?: {
		id: number;
		uuid: string;
		name?: string;
		tokenSymbol?: string;
		tokenSupply?: number;
	};
	totalInvestors: number;
	totalCapitalRaised: number;
	totalTokensHeld: number;
	topHolders: Array<{
		userId: number;
		investorName: string;
		amountInvested: number;
		tokensHeld: number;
		ownershipPercentage: number;
		status: string;
	}>;
};

const buildProjectInvestorsPath = (projectId?: string) => {
	const normalizedProjectId = String(projectId ?? '').trim();
	if (!normalizedProjectId) {
		return `/${PATHS.PROJECT_INVESTORS}`;
	}

	return `/${PATHS.PROJECT_INVESTORS}?${createSearchParams({
		projectId: normalizedProjectId,
	}).toString()}`;
};

const getStatusLabel = (status?: string) => {
	if (status === 'under_review') return 'Under Review';
	if (status === 'changes_requested') return 'Changes Requested';
	if (status === 'approved') return 'Approved';
	if (status === 'issued') return 'Issued';
	if (status === 'live') return 'Live';
	if (status === 'locked') return 'Locked';
	return 'In Preparation';
};

const getLifecycleNote = (status?: string) => {
	if (status === 'under_review') return 'Submitted and awaiting admin review.';
	if (status === 'changes_requested')
		return 'Admin feedback is available and requires developer revision.';
	if (status === 'approved') return 'Approved and ready for issuance steps.';
	if (status === 'issued') return 'Issued and ready for live raise monitoring.';
	if (status === 'live')
		return 'Visible to investors and actively raising capital.';
	if (status === 'locked') return 'Locked and awaiting operational follow-up.';
	return 'Still in preparation and not yet visible to investors.';
};

const getNextActionLabel = (status?: string) => {
	if (status === 'under_review') return 'Track review outcome';
	if (status === 'changes_requested') return 'Address requested changes';
	if (status === 'approved') return 'Prepare issuance';
	if (status === 'issued') return 'Activate live raise';
	if (status === 'live') return 'Monitor raise activity';
	if (status === 'locked') return 'Resolve lock reason';
	return 'Complete setup and submit';
};

function KpiCard({
	title,
	value,
	subtitle,
	accent = 'neutral',
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
			className={`rounded-[12px] border px-5 py-4 shadow-[var(--shadow-soft)] ${styles}`}
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

function PortfolioStatusStrip({
	items,
}: {
	items: Array<{ label: string; value: string }>;
}) {
	return (
		<div className="theme-surface rounded-[18px] border px-4 py-3 shadow-[var(--shadow-soft)]">
			<div className="flex flex-wrap items-center gap-2">
				{items.map((item) => (
					<div
						key={item.label}
						className="theme-surface-muted flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 py-2"
					>
						<span className="theme-text-muted text-[11px] font-semibold uppercase tracking-[0.08em]">
							{item.label}
						</span>
						<span className="theme-heading text-[15px] font-semibold leading-none">
							{item.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function CapitalProgressCard({
	totalTarget,
	committedCapital,
	settledCapital,
	onViewDetails,
}: {
	totalTarget: number;
	committedCapital: number;
	settledCapital: number;
	onViewDetails: () => void;
}) {
	const safeTarget = Math.max(Number(totalTarget) || 0, 0);
	const safeCommitted = Math.max(Number(committedCapital) || 0, 0);
	const safeSettled = Math.max(Number(settledCapital) || 0, 0);
	const progressPct =
		safeTarget > 0
			? Math.max(
					0,
					Math.min(100, Math.round((safeCommitted / safeTarget) * 100)),
			  )
			: 0;
	const animatedProgressPct = useAnimatedNumber(progressPct);
	const animatedCommitted = useAnimatedNumber(safeCommitted);
	const animatedSettled = useAnimatedNumber(safeSettled);
	const animatedTarget = useAnimatedNumber(safeTarget);

	return (
		<div className="overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#1E5FAF_0%,#174C8E_100%)] px-7 py-7 text-white shadow-[0_6px_16px_rgba(47,128,237,0.14)] sm:px-8">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="min-w-0 lg:w-[45%]">
					<div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
						Capital Raising Progress
					</div>
					<div className="mt-4 text-[44px] font-semibold leading-none tracking-[-0.03em]">
						{Math.round(animatedProgressPct)}%
					</div>
					<div className="mt-2 text-[15px] font-semibold text-white/85">
						of total capital targeted
					</div>
					<p className="mt-4 max-w-[390px] text-[13px] leading-[1.65] text-white/75">
						You've raised {money(animatedCommitted)} in committed capital across
						all active projects.
					</p>
					<button
						type="button"
						onClick={onViewDetails}
						className="mt-5 text-[14px] font-semibold text-white transition hover:text-white/80 hover:underline"
					>
						View funding details →
					</button>
				</div>

				<div className="min-w-0 lg:w-[55%]">
					<div className="h-[18px] w-full overflow-hidden rounded-full bg-white/20">
						<div
							className="h-full rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.24)]"
							style={{
								width: `${Math.max(0, Math.min(100, animatedProgressPct))}%`,
							}}
						/>
					</div>
					<div className="mt-5 flex items-start justify-between gap-4">
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white/80" />
								<div className="text-[14px] font-semibold text-white">
									{money(animatedCommitted)}
								</div>
							</div>
							<div className="mt-1 pl-[18px] text-[13px] text-white/75">
								Committed
							</div>
						</div>

						<div className="min-w-0 text-center">
							<div className="flex items-center justify-center gap-2">
								<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white/80" />
								<div className="text-[14px] font-semibold text-white">
									{money(animatedSettled)}
								</div>
							</div>
							<div className="mt-1 text-[13px] text-white/75">Settled</div>
						</div>

						<div className="min-w-0 text-right">
							<div className="text-[14px] font-semibold text-white">
								{money(animatedTarget)}
							</div>
							<div className="mt-1 text-[13px] text-white/75">Target</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function StatusPill({ status }: { status: ClimateProject['statusLabel'] }) {
	if (status === 'Under Review') {
		return (
			<span className="rounded-full border border-[#F0C8D8] bg-[#FFF2F8] px-3 py-1 text-[10px] font-medium text-[#B34D79]">
				Under Review
			</span>
		);
	}

	if (status === 'Approved') {
		return (
			<span className="rounded-full border border-[#DCE7F5] bg-[#F8FBFF] px-3 py-1 text-[10px] font-medium text-[#2C67B1]">
				Approved
			</span>
		);
	}

	if (status === 'Issued') {
		return (
			<span className="rounded-full border border-[#D6F5E8] bg-[#F2FFF8] px-3 py-1 text-[10px] font-medium text-[#0F8A5F]">
				Issued
			</span>
		);
	}

	if (status === 'Live') {
		return (
			<span className="rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1 text-[10px] font-medium text-[#047857]">
				Live
			</span>
		);
	}

	if (status === 'Locked') {
		return (
			<span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1 text-[10px] font-medium text-[#4B5563]">
				Locked
			</span>
		);
	}

	if (status === 'Changes Requested') {
		return (
			<span className="rounded-full border border-[#FBCFE8] bg-[#FDF2F8] px-3 py-1 text-[10px] font-medium text-[#BE185D]">
				Changes Requested
			</span>
		);
	}

	return (
		<span className="rounded-full border border-[#CAE1FB] bg-[#EFF7FF] px-3 py-1 text-[10px] font-medium text-[#4C86CD]">
			In Preparation
		</span>
	);
}

function ProjectRow({
	project,
	selected,
	onSelect,
	onOpen,
	onViewInvestors,
	onViewTransactions,
	onDelete,
	isDeleting,
}: {
	project: ClimateProject;
	selected: boolean;
	onSelect: () => void;
	onOpen: () => void;
	onViewInvestors: () => void;
	onViewTransactions: () => void;
	onDelete: () => void;
	isDeleting: boolean;
}) {
	const readinessWidth = project.progressPct;
	const isDraft = project.backendStatus === 'draft';

	return (
		<div
			className={`w-full rounded-[18px] border text-left transition ${
				selected
					? 'theme-surface border-[#2F80ED] shadow-[0_10px_24px_rgba(47,128,237,0.12)]'
					: 'theme-surface border-[var(--border-color)] hover:border-[#BFD3F2]'
			}`}
		>
			<button
				type="button"
				onClick={onSelect}
				className="w-full px-4 py-4 text-left"
			>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="theme-heading text-[15px] font-semibold">
								{project.name}
							</h3>
							<StatusPill status={project.statusLabel} />
						</div>
						<div className="theme-text-secondary mt-2 text-[12px] leading-[1.45]">
							{project.lifecycleNote}
						</div>
					</div>

					<div className="theme-surface-muted min-w-[132px] rounded-[14px] border px-3 py-2.5 lg:text-right">
						<div className="theme-text-muted text-[10px] font-semibold uppercase tracking-[0.14em]">
							Capital Targeted
						</div>
						<div className="theme-heading mt-1 text-[18px] font-semibold tracking-[-0.02em]">
							{money(project.fundingGoal)}
						</div>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.25fr]">
					<div className="theme-surface-muted rounded-[14px] border px-3.5 py-3">
						<div className="theme-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
							Completion
						</div>
						<div className="theme-heading mt-1 text-[15px] font-semibold">
							{project.completionLabel}
						</div>
					</div>

					<div className="theme-surface-muted rounded-[14px] border px-3.5 py-3">
						<div className="theme-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
							Settled Capital
						</div>
						<div className="theme-heading mt-1 text-[15px] font-semibold">
							{money(project.settledCapital)}
						</div>
						<div className="theme-text-secondary mt-1 text-[12px]">
							{project.investorCount} investor
							{project.investorCount === 1 ? '' : 's'}
						</div>
					</div>

					<div className="theme-surface-muted rounded-[14px] border px-3.5 py-3">
						<div className="flex items-center justify-between gap-3">
							<div className="theme-text-muted text-[10px] font-semibold uppercase tracking-[0.12em]">
								Funding Progress
							</div>
							<div className="theme-text-secondary text-[12px] font-medium">
								{readinessWidth}%
							</div>
						</div>
						<div className="mt-2 h-[6px] rounded-full bg-[var(--border-color)]">
							<div
								className="h-[6px] rounded-full bg-[#69B7F6]"
								style={{ width: `${readinessWidth}%` }}
							/>
						</div>
						<div className="mt-2 text-[12px] font-medium text-[#163F74]">
							{money(project.settledCapital)} of {money(project.fundingGoal)}
						</div>
					</div>
				</div>
			</button>

			<div className="theme-border flex flex-col gap-3 border-t px-4 pb-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="theme-text-secondary text-[12px] leading-[1.45]">
					Next action: {project.nextActionLabel}
				</div>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onViewTransactions}
						className="theme-button-secondary rounded-[10px] border px-4 py-2 text-[13px] font-semibold transition"
					>
						Transactions
					</button>
					<button
						type="button"
						onClick={onViewInvestors}
						className="theme-button-secondary rounded-[10px] border px-4 py-2 text-[13px] font-semibold transition"
					>
						Investors
					</button>
					{isDraft ? (
						<button
							type="button"
							onClick={onDelete}
							disabled={isDeleting}
							className="theme-button-secondary rounded-[10px] border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isDeleting ? 'Deleting...' : 'Delete Draft'}
						</button>
					) : null}
					<button
						type="button"
						onClick={onOpen}
						className="theme-button-primary rounded-[10px] px-4 py-2 text-[13px] font-semibold shadow-[0_6px_14px_rgba(47,128,237,0.14)]"
					>
						Open Project
					</button>
				</div>
			</div>
		</div>
	);
}

function getGreeting() {
	const hour = new Date().getHours();

	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

export default function Dashboard() {
	const navigate = useNavigate();
	const { user } = useUserStore();
	const [selectedId, setSelectedId] = useState<string>('');
	const [climateProjects, setClimateProjects] = useState<ClimateProject[]>([]);
	const [developerTransactions, setDeveloperTransactions] = useState<
		ITransaction[]
	>([]);
	const [selectedInvestorSummary, setSelectedInvestorSummary] =
		useState<InvestorSummary | null>(null);
	const [loadingClimate, setLoadingClimate] = useState(false);
	const [loadingInvestors, setLoadingInvestors] = useState(false);
	const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		const load = async () => {
			if (user?.type !== UserType.CLIMATE_DEVELOPER) return;

			try {
				setLoadingClimate(true);
				const [projectRows, transactionResponse] = await Promise.all([
					projectService.getMyProjects(),
					transactionService.getDeveloperTransactions({
						sortBy: 'createdAt',
					}),
				]);
				const mapped = (projectRows || []).map((p: any) => ({
					id: String(p.id),
					uuid: p.uuid ? String(p.uuid) : undefined,
					name: p.name || 'Untitled Project',
					statusLabel: getStatusLabel(p.status),
					backendStatus: String(
						p.status || 'draft',
					) as ClimateProject['backendStatus'],
					fundingGoal: Number(p.fundingGoal || 0),
					settledCapital: Number(p.amountSettled ?? p.fundedSoFar ?? 0),
					investorCount: Number(p.investorCount ?? 0),
					completionLabel: `${p.completedCount || 0}/${
						p.totalSections || 0
					} sections`,
					lifecycleNote: getLifecycleNote(p.status),
					progressPct: getPct(
						Number(p.fundingGoal || 0),
						Number(p.amountSettled ?? p.fundedSoFar ?? 0),
					),
					nextActionLabel: getNextActionLabel(p.status),
				}));
				setClimateProjects(mapped);
				if (mapped.length > 0) setSelectedId(mapped[0].id);

				setDeveloperTransactions(
					(transactionResponse?.data || []).map(({ attributes, id }: any) => ({
						...attributes,
						id,
					})),
				);
			} catch (e) {
				console.error(e);
			} finally {
				setLoadingClimate(false);
			}
		};
		load();
	}, [user?.type]);

	useEffect(() => {
		if (user?.type !== UserType.CLIMATE_DEVELOPER || !selectedId) {
			setSelectedInvestorSummary(null);
			return;
		}

		const loadInvestorSummary = async () => {
			try {
				setLoadingInvestors(true);
				const response = await projectService.getProjectInvestors(selectedId);
				setSelectedInvestorSummary(response || null);
			} catch (error) {
				console.error('Failed to load project investor summary', error);
				setSelectedInvestorSummary(null);
			} finally {
				setLoadingInvestors(false);
			}
		};

		void loadInvestorSummary();
	}, [selectedId, user?.type]);

	const selectedProject = useMemo(
		() =>
			climateProjects.find((project) => project.id === selectedId) ??
			(climateProjects[0] || {
				id: '',
				name: 'No project selected',
				statusLabel: 'In Preparation',
				backendStatus: 'draft',
				fundingGoal: 0,
				settledCapital: 0,
				investorCount: 0,
				completionLabel: '0/0 sections',
				lifecycleNote: 'No projects available yet.',
				progressPct: 0,
				nextActionLabel: 'Create your first project',
			}),
		[selectedId, climateProjects],
	);

	const activeDeals = climateProjects.length;
	const capitalTargeted = climateProjects.reduce(
		(sum, project) => sum + (Number(project.fundingGoal) || 0),
		0,
	);
	const committedCapitalRaised = developerTransactions
		.filter(
			(transaction) =>
				transaction.type === TransactionType.BUY &&
				String(transaction.status || '').toUpperCase() !== 'FAILED',
		)
		.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
	const settledCapitalRaised = climateProjects.reduce(
		(sum, project) => sum + (Number(project.settledCapital) || 0),
		0,
	);
	const investorCountEstimate = climateProjects.reduce(
		(sum, project) => sum + (Number(project.investorCount) || 0),
		0,
	);
	const pendingActions = climateProjects.filter((project) =>
		['draft', 'changes_requested', 'approved', 'issued', 'locked'].includes(
			project.backendStatus,
		),
	).length;
	const underReview = climateProjects.filter(
		(project) => project.backendStatus === 'under_review',
	).length;
	const inPreparation = climateProjects.filter(
		(project) => project.backendStatus === 'draft',
	).length;
	const liveProjects = climateProjects.filter(
		(project) => project.backendStatus === 'live',
	).length;
	const issuedProjects = climateProjects.filter(
		(project) => project.backendStatus === 'issued',
	).length;
	const changesRequested = climateProjects.filter(
		(project) => project.backendStatus === 'changes_requested',
	).length;

	const selectedProjectTransactions = useMemo(() => {
		if (!selectedProject.id) return developerTransactions.slice(0, 5);

		const matching = developerTransactions.filter((transaction) => {
			const transactionProjectId = String(transaction.project?.id || '');
			const transactionProjectUuid = String(transaction.project?.uuid || '');
			return (
				transactionProjectId === selectedProject.id ||
				(selectedProject.uuid &&
					transactionProjectUuid === selectedProject.uuid)
			);
		});

		return matching.slice(0, 5);
	}, [developerTransactions, selectedProject.id, selectedProject.uuid]);

	const hasSelectedProject = Boolean(selectedProject.id);
	const hasSettledInvestorPositions = Boolean(
		hasSelectedProject && selectedInvestorSummary?.topHolders?.length,
	);
	const recentBuysCount = selectedProjectTransactions.filter(
		(transaction) => transaction.type === TransactionType.BUY,
	).length;
	const recentDistributionsCount = selectedProjectTransactions.filter(
		(transaction) => transaction.type === TransactionType.DISTRIBUTION,
	).length;
	const recentFeesCount = selectedProjectTransactions.filter(
		(transaction) => transaction.type === TransactionType.FEE,
	).length;

	const summaryRows = [
		{ label: 'Total Projects', value: String(activeDeals) },
		{ label: 'In Preparation', value: String(inPreparation) },
		{ label: 'Under Review', value: String(underReview) },
		{ label: 'Changes Requested', value: String(changesRequested) },
		{ label: 'Issued', value: String(issuedProjects) },
		{ label: 'Live', value: String(liveProjects) },
	];

	const handleOpenProject = (projectId: string) => {
		if (!projectId) return;
		navigate(`/project-setup?projectId=${projectId}`);
	};

	const handleOpenProjectInvestors = (projectId: string) => {
		if (!projectId) return;
		navigate(buildProjectInvestorsPath(projectId));
	};

	const handleOpenProjectTransactions = (project: ClimateProject) => {
		if (project.uuid) {
			navigate(`/${PATHS.DEV_TRANSACTIONS}?projectUuid=${project.uuid}`);
			return;
		}
		navigate(`/${PATHS.DEV_TRANSACTIONS}`);
	};

	const handleDeleteDraft = async (projectId: string) => {
		const project = climateProjects.find((item) => item.id === projectId);
		if (!project || project.backendStatus !== 'draft') return;

		const confirmed = window.confirm(
			`Delete draft "${project.name}"? This cannot be undone.`,
		);
		if (!confirmed) return;

		try {
			setDeletingProjectId(projectId);
			await projectService.deleteProject(projectId);
			setClimateProjects((prev) => {
				const next = prev.filter((item) => item.id !== projectId);
				setSelectedId((current) => {
					if (current !== projectId) return current;
					return next[0]?.id ?? '';
				});
				return next;
			});
		} catch (error) {
			console.error('Failed to delete draft project', error);
			window.alert('Failed to delete draft project. Please try again.');
		} finally {
			setDeletingProjectId(null);
		}
	};

	return (
		<div
			className="theme-page-shell mb-4 flex w-full flex-col gap-y-6"
			data-test="dashboard"
		>
			{user?.type === UserType.CLIMATE_DEVELOPER && (
				<div className="theme-page-shell min-h-full w-full bg-[#F7F8FB] px-4 py-4">
					<div className="max-w-[1220px]">
						<AdminPageHeader
							eyebrow="Climate Developer Portal"
							title={`${getGreeting()}, ${user?.fullName || 'Developer'}`}
							description="Track your project's funding status and investor engagement."
							actions={
								<div className="flex items-center gap-3">
									<button
										type="button"
										onClick={() => navigate('/support')}
										className="theme-button-secondary rounded-[14px] border px-5 py-3 text-[14px] font-semibold"
									>
										Report an Issue
									</button>
									<button
										type="button"
										onClick={() => navigate('/project-setup')}
										className="theme-button-primary rounded-[14px] px-5 py-3 text-[14px] font-semibold shadow-[0_8px_18px_rgba(47,128,237,0.14)]"
									>
										+ New Project
									</button>
								</div>
							}
						/>

						{loadingClimate ? (
							<div className="theme-surface rounded-[18px] border px-5 py-8 text-sm text-[#61708A] shadow-[var(--shadow-soft)]">
								Loading developer operational dashboard...
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
									<KpiCard
										title="Active Projects"
										value={activeDeals}
										subtitle={`${liveProjects} live\n${underReview} under review`}
										accent="blue"
									/>
									<KpiCard
										title="Total Capital Targeted"
										value={money(capitalTargeted)}
										subtitle={
											'Funding goals across\nall visible developer projects'
										}
										accent="pink"
									/>
									<KpiCard
										title="Capital Raised"
										value={money(settledCapitalRaised)}
										subtitle={
											'Settled capital based on\ncurrent platform funding records'
										}
										accent="blue"
									/>
									<KpiCard
										title="Investor Count"
										value={investorCountEstimate}
										subtitle={
											'Summed across project registers\nrepeat investors may appear in multiple projects'
										}
										accent="pink"
									/>
									<KpiCard
										title="Pending Actions"
										value={pendingActions}
										subtitle={
											'Projects requiring a next step\nfrom developer or platform workflow'
										}
										accent="blue"
									/>
								</div>

								<div className="mt-3">
									<PortfolioStatusStrip items={summaryRows} />
								</div>

								<div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)] xl:items-start">
									<div className="space-y-3">
										<CapitalProgressCard
											totalTarget={capitalTargeted}
											committedCapital={committedCapitalRaised}
											settledCapital={settledCapitalRaised}
											onViewDetails={() =>
												handleOpenProjectTransactions(selectedProject)
											}
										/>

										<div className="theme-surface rounded-[18px] border p-5 shadow-[var(--shadow-soft)]">
											<div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
												<div>
													<h2 className="text-[18px] font-semibold text-[#163F74]">
														Deal Room
													</h2>
													<p className="mt-1 text-[13px] leading-[1.35] text-[#61708A]">
														Monitor project setup, raise progress, investor
														visibility, and operational next steps.
													</p>
												</div>
												<div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6D7D97]">
													{activeDeals} active
												</div>
											</div>

											<div className="space-y-2.5">
												{climateProjects.length === 0 ? (
													<div className="theme-surface-muted rounded-[14px] border border-dashed px-4 py-4 text-sm text-[#66748E]">
														No projects yet
													</div>
												) : (
													climateProjects.map((project) => (
														<ProjectRow
															key={project.id}
															project={project}
															selected={project.id === selectedId}
															onSelect={() => setSelectedId(project.id)}
															onOpen={() => handleOpenProject(project.id)}
															onViewInvestors={() =>
																handleOpenProjectInvestors(project.id)
															}
															onViewTransactions={() =>
																handleOpenProjectTransactions(project)
															}
															onDelete={() => handleDeleteDraft(project.id)}
															isDeleting={deletingProjectId === project.id}
														/>
													))
												)}
											</div>
										</div>

										<div className="theme-surface rounded-[18px] border p-5 shadow-[var(--shadow-soft)]">
											<div className="mb-3 flex items-start justify-between gap-3">
												<div>
													<h2 className="text-[18px] font-semibold text-[#163F74]">
														Recent Transaction Activity
													</h2>
													<p className="mt-1 text-[12px] leading-[1.4] text-[#61708A]">
														Project-level capital flow visibility for the
														currently selected project.
													</p>
												</div>
												<button
													type="button"
													onClick={() =>
														handleOpenProjectTransactions(selectedProject)
													}
													className="text-[12px] font-medium text-[#5179B5]"
												>
													Open Transactions
												</button>
											</div>

											{selectedProjectTransactions.length ? (
												<div className="space-y-3">
													{selectedProjectTransactions.map((transaction) => (
														<div
															key={String(transaction.id)}
															className="theme-surface-muted flex flex-col gap-2 rounded-[18px] border px-4 py-3 md:flex-row md:items-center md:justify-between"
														>
															<div className="min-w-0">
																<div className="flex flex-wrap items-center gap-2">
																	<div className="text-[14px] font-semibold text-[#163F74]">
																		{TransactionTypeLabels[transaction.type] ||
																			transaction.type}
																	</div>
																	<AdminStatusBadge
																		label={
																			TransactionStatusLabels[
																				transaction.status
																			] || transaction.status
																		}
																		tone={
																			transaction.status === 'COMPLETED'
																				? 'blue'
																				: transaction.status === 'FAILED'
																				? 'pink'
																				: 'yellow'
																		}
																	/>
																</div>
																<div className="mt-1 text-[12px] text-[#5F6C86]">
																	{formatDateTime(transaction.createdAt)} •{' '}
																	{transaction.project?.name ||
																		selectedProject.name}
																</div>
															</div>
															<div className="text-left md:text-right">
																<div className="text-[14px] font-semibold text-[#163F74]">
																	{money(transaction.amount)}
																</div>
																<div className="mt-1 text-[12px] text-[#5F6C86]">
																	{transaction.tokenAmount ?? '—'} tokens
																</div>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className="theme-surface-muted rounded-[14px] border border-dashed px-4 py-3 text-[13px] text-[#66748E]">
													No transaction activity yet for this project.
												</div>
											)}
										</div>
									</div>

									<div className="space-y-3">
										<div className="theme-surface rounded-[18px] border p-5 shadow-[var(--shadow-soft)]">
											<div className="mb-3 flex items-start justify-between gap-3">
												<div>
													<h2 className="text-[18px] font-semibold text-[#163F74]">
														Selected Project
													</h2>
													<p className="mt-1 text-[12px] leading-[1.4] text-[#61708A]">
														Project-level raise, investor, and transaction
														visibility.
													</p>
												</div>
												<AdminStatusBadge
													label={selectedProject.statusLabel}
													tone={
														selectedProject.backendStatus === 'live'
															? 'blue'
															: selectedProject.backendStatus ===
																	'changes_requested' ||
															  selectedProject.backendStatus === 'locked'
															? 'pink'
															: 'yellow'
													}
												/>
											</div>
											<div className="space-y-2.5">
												<div className="theme-surface-muted rounded-[16px] border px-3.5 py-3">
													<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
														Next Action
													</div>
													<div className="mt-2 text-[14px] font-semibold text-[#163F74]">
														{selectedProject.nextActionLabel}
													</div>
													<div className="mt-1 text-[12px] text-[#5F6C86]">
														{selectedProject.lifecycleNote}
													</div>
												</div>
												<div className="theme-surface-muted rounded-[16px] border px-3.5 py-3">
													<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
														Investor Visibility
													</div>
													<div className="mt-2 text-[14px] font-semibold text-[#163F74]">
														{loadingInvestors
															? 'Loading investor data...'
															: `${
																	selectedInvestorSummary?.totalInvestors ??
																	selectedProject.investorCount
															  } investors`}
													</div>
													<div className="mt-1 text-[12px] text-[#5F6C86]">
														{loadingInvestors
															? 'Fetching settled holdings and cap-table summary.'
															: `${money(
																	selectedInvestorSummary?.totalCapitalRaised ??
																		selectedProject.settledCapital,
															  )} from completed buy transactions`}
													</div>
												</div>
												<div className="theme-surface-muted rounded-[16px] border px-3.5 py-3">
													<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
														Recent Activity
													</div>
													<div className="mt-2 text-[14px] font-semibold text-[#163F74]">
														{selectedProjectTransactions.length} recent
														transaction
														{selectedProjectTransactions.length === 1
															? ''
															: 's'}
													</div>
													<div className="mt-1 text-[12px] text-[#5F6C86]">
														{recentBuysCount} buys, {recentDistributionsCount}{' '}
														distributions, {recentFeesCount} fees
													</div>
												</div>
												{hasSettledInvestorPositions ? (
													<div className="theme-surface-muted rounded-[16px] border px-3.5 py-3">
														<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
															Cap Table
														</div>
														<div className="mt-2 text-[14px] font-semibold text-[#163F74]">
															{selectedInvestorSummary?.topHolders?.length ?? 0}{' '}
															settled holder
															{selectedInvestorSummary?.topHolders?.length === 1
																? ''
																: 's'}
														</div>
														<div className="mt-1 text-[12px] text-[#5F6C86]">
															{money(
																selectedInvestorSummary?.totalCapitalRaised ??
																	selectedProject.settledCapital,
															)}{' '}
															in settled investor positions
														</div>
													</div>
												) : null}
												<div className="flex flex-wrap gap-2 pt-1">
													<button
														type="button"
														onClick={() =>
															handleOpenProjectInvestors(selectedProject.id)
														}
														disabled={!selectedProject.id}
														className="theme-button-secondary rounded-[12px] border px-3.5 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
													>
														View Investors
													</button>
													{hasSettledInvestorPositions ? (
														<button
															type="button"
															onClick={() =>
																handleOpenProjectInvestors(selectedProject.id)
															}
															className="theme-button-secondary rounded-[12px] border px-3.5 py-2 text-[13px] font-semibold"
														>
															Open Cap Table
														</button>
													) : null}
													<button
														type="button"
														onClick={() =>
															handleOpenProjectTransactions(selectedProject)
														}
														className="theme-button-secondary rounded-[12px] border px-3.5 py-2 text-[13px] font-semibold"
													>
														View Transactions
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{user?.type === UserType.WEALTH_MANAGER && <DashboardClientsCard />}

			{user?.type !== UserType.CLIMATE_DEVELOPER &&
				user?.type !== UserType.WEALTH_MANAGER && <InvestorDashboard />}
		</div>
	);
}
