import { useCallback, useEffect, useMemo, useState } from 'react';

import PortfolioCharts from '@/components/dashboard/PortfolioCharts';
import DashboardCard from '@/components/dashboard/card';
import PortfolioTable from '@/components/portfolio/table';
import { SOROBAN_TOKEN_EXPONENT } from '@/constants/common/stellar';
import { UserType } from '@/constants/enum/user-type.enum';
import { IProject } from '@/interfaces/api/IProject';
import { userService } from '@/services/user.service';
import { useStellarStore } from '@/store/stellar.store';
import { useUserStore } from '@/store/user.store';

const DashboardInvestmentsCard: React.FC = () => {
	const { user } = useUserStore();
	const { selectedClientPublicKey } = useStellarStore();

	const [projects, setProjects] = useState<IProject[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const getPortfolio = useCallback(async () => {
		try {
			if (user?.type === UserType.WEALTH_MANAGER && !selectedClientPublicKey) {
				setProjects([]);
				return;
			}

			if (user?.type !== UserType.WEALTH_MANAGER && !user?.walletAddress) {
				setProjects([]);
				return;
			}

			const userAddress =
				user?.type === UserType.WEALTH_MANAGER
					? selectedClientPublicKey
					: user?.walletAddress;

			if (!userAddress) {
				setProjects([]);
				return;
			}

			setIsLoading(true);

			const { data } = await userService.getUserPortfolio(userAddress);

			const projectsData: IProject[] = data.map((project: any) => ({
				...project.attributes,
				id: project.id ?? '',
			}));

			setProjects(projectsData);
		} catch (error) {
			console.error(
				'An error occurred while fetching dashboard portfolio',
				error,
			);
			setProjects([]);
		} finally {
			setIsLoading(false);
		}
	}, [user?.type, user?.walletAddress, selectedClientPublicKey]);

	useEffect(() => {
		getPortfolio();
	}, [getPortfolio]);

	const chartReadyInvestments = useMemo(() => {
		return projects.map((project: any) => {
			const purchased =
				((project.purchasedAmount as number) ?? 0) / SOROBAN_TOKEN_EXPONENT;

			const tokenPrice = 1;

			const invested = purchased * tokenPrice;

			return {
				id: project.id,
				name: project.name || 'Unnamed Project',
				symbol: project.tokenSymbol || '',
				tokenPrice,
				purchased,
				invested,
				createdAt:
					project.createdAt ||
					project.created_at ||
					project.updatedAt ||
					project.updated_at ||
					new Date().toISOString(),
			};
		});
	}, [projects]);

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('en-AU', {
			style: 'currency',
			currency: 'AUD',
			maximumFractionDigits: 0,
		}).format(value);

	const getProjectDeadline = (project: IProject) => {
		const rawDate =
			(project as any)?.closeDate ||
			(project as any)?.closingDate ||
			(project as any)?.fundingDeadline ||
			(project as any)?.deadline ||
			(project as any)?.endDate;

		if (!rawDate) return null;

		const date = new Date(rawDate);
		return Number.isNaN(date.getTime()) ? null : date;
	};

	const summary = useMemo(() => {
		const totalInvested = chartReadyInvestments.reduce(
			(sum, investment) => sum + investment.invested,
			0,
		);

		const portfolioValue = totalInvested;
		const activeInvestments = chartReadyInvestments.length;

		const remainingDaysList = projects
			.map((project) => {
				const deadline = getProjectDeadline(project);
				if (!deadline) return null;

				const now = new Date();
				const diffMs = deadline.getTime() - now.getTime();
				const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

				return diffDays;
			})
			.filter((days): days is number => days !== null);

		const daysRemaining =
			remainingDaysList.length > 0 ? Math.min(...remainingDaysList) : null;

		const actionRequired = remainingDaysList.filter(
			(days) => days >= 0 && days <= 14,
		).length;

		return {
			totalInvested,
			portfolioValue,
			activeInvestments,
			daysRemaining,
			actionRequired,
		};
	}, [chartReadyInvestments, projects]);

	const summaryCards = [
		{
			title: 'Total Invested',
			value: formatCurrency(summary.totalInvested),
			subtitle: `Across ${summary.activeInvestments} investment${
				summary.activeInvestments === 1 ? '' : 's'
			}`,
			bgClass: 'bg-gradient-to-br from-sky-50 via-white to-sky-50/40',
			accentClass: 'bg-sky-400',
		},
		{
			title: 'Portfolio Value',
			value: formatCurrency(summary.portfolioValue),
			subtitle: 'Current portfolio value',
			bgClass: 'bg-gradient-to-br from-sky-50 via-white to-sky-50/40',
			accentClass: 'bg-sky-400',
		},
		{
			title: 'Active Investments',
			value: String(summary.activeInvestments),
			subtitle: 'Projects currently held',
			bgClass: 'bg-gradient-to-br from-sky-50 via-white to-sky-50/40',
			accentClass: 'bg-sky-400',
		},
		{
			title: 'Days Remaining',
			value:
				summary.daysRemaining === null
					? 'TBC'
					: summary.daysRemaining < 0
					? 'Closed'
					: `${summary.daysRemaining} Days`,
			subtitle: 'Nearest project close',
			bgClass: 'bg-gradient-to-br from-sky-50 via-white to-sky-50/40',
			accentClass: 'bg-sky-400',
		},
		{
			title: 'Action Required',
			value: String(summary.actionRequired),
			subtitle: 'Projects closing soon',
			bgClass: 'bg-gradient-to-br from-pink-50 via-white to-pink-50/40',
			accentClass: 'bg-pink-500',
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
				{summaryCards.map((card) => (
					<div
						key={card.title}
						className={`relative overflow-hidden rounded-xl border border-slate-100 p-5 shadow-sm ${card.bgClass}`}
					>
						<div
							className={`absolute left-0 top-0 h-full w-[3px] ${card.accentClass}`}
						/>
						<p className="text-sm font-medium text-slate-500">{card.title}</p>
						<h3 className="mt-2 text-3xl font-bold text-slate-900">
							{card.value}
						</h3>
						<p className="mt-2 text-sm text-slate-500">{card.subtitle}</p>
					</div>
				))}
			</div>

			<DashboardCard
				title={
					user?.type === UserType.WEALTH_MANAGER
						? 'Client Investments'
						: 'My Investments'
				}
				isLoading={isLoading}
				emptyOptions={{
					isEmpty: !projects.length,
					title:
						user?.type === UserType.WEALTH_MANAGER && !selectedClientPublicKey
							? 'Please select a client to fetch investments'
							: "You haven't invested in any projects yet",
				}}
				cardId="investments"
			>
				<div className="flex w-full flex-col rounded-xl bg-white">
					{!!chartReadyInvestments.length && (
						<PortfolioCharts investments={chartReadyInvestments} />
					)}

					<PortfolioTable projects={projects} projectBalances={{}} />
				</div>
			</DashboardCard>
		</div>
	);
};

export default DashboardInvestmentsCard;
