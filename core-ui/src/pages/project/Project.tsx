import { CalendarDays, Leaf, MapPin, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '@/components/common/button';
import Loader from '@/components/common/loader';
import AppPageHeader from '@/components/layout/AppPageHeader';
import AppPageShell from '@/components/layout/AppPageShell';
import BuyTokensModal from '@/components/modal/buy-tokens-modal';
import { SOROBAN_TOKEN_EXPONENT } from '@/constants/common/stellar';
import { UserType } from '@/constants/enum/user-type.enum';
import { PATHS } from '@/constants/routes/paths';
import useUserTypeLabel from '@/hooks/common/useUserTypeLabel';
import { IProject } from '@/interfaces/api/IProject';
import { notificationService } from '@/services/notification.service';
import { ownershipService } from '@/services/ownership.service';
import { projectService } from '@/services/project.service';
import { useUserStore } from '@/store/user.store';
import { formatBooleanAsString } from '@/utils/format-boolean-as-string';
import { shortenStellarAddress } from '@/utils/shorten-stellar-address';
import { getAssetUrl } from '@/utils/stellarAsset';

interface IProjectParams extends Record<string, string> {
	projectId: string;
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat('en-AU', {
		style: 'currency',
		currency: 'AUD',
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDateRange(startDate?: string, endDate?: string) {
	if (!startDate && !endDate) return 'Timeline to be confirmed';

	const start = startDate ? new Date(startDate).toLocaleDateString() : 'TBC';
	const end = endDate ? new Date(endDate).toLocaleDateString() : 'TBC';

	return `${start} - ${end}`;
}

function formatMetricValue(value?: string | number | null) {
	if (value == null) return 'Not provided';
	if (typeof value === 'number') return value.toLocaleString();

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : 'Not provided';
}

function splitParagraphs(value?: string | null) {
	return String(value || '')
		.split('\n')
		.map((item) => item.trim())
		.filter(Boolean);
}

function InfoTile({
	label,
	value,
	href,
	dataTest,
}: {
	label: string;
	value: string;
	href?: string;
	dataTest?: string;
}) {
	return (
		<div className="rounded-[14px] border border-[#E7ECF4] bg-[#F7F8FB] px-4 py-4">
			<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
				{label}
			</div>
			{href ? (
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-2 block text-[14px] font-semibold text-[#1C4FA3] hover:underline"
					data-test={dataTest}
				>
					{value}
				</a>
			) : (
				<div
					className="mt-2 break-words text-[14px] leading-[1.6] text-[#163F74]"
					data-test={dataTest}
				>
					{value}
				</div>
			)}
		</div>
	);
}

function MetricCard({
	label,
	value,
	highlight = false,
}: {
	label: string;
	value: string;
	highlight?: boolean;
}) {
	return (
		<div
			className={`rounded-[18px] border p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)] ${
				highlight
					? 'border-[#D6E4FF] bg-[#F3F7FF]'
					: 'border-[#E7ECF4] bg-white'
			}`}
		>
			<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
				{label}
			</div>
			<div
				className={`mt-3 text-[28px] font-semibold tracking-[-0.03em] ${
					highlight ? 'text-[#1C4FA3]' : 'text-[#163F74]'
				}`}
			>
				{value}
			</div>
		</div>
	);
}

function ContentCard({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className="rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
			<div className="border-b border-[#E7ECF4] pb-4">
				<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
					Project Detail
				</div>
				<h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-[#163F74]">
					{title}
				</h2>
				{description ? (
					<p className="mt-2 text-[14px] leading-[1.7] text-[#5F6C86]">
						{description}
					</p>
				) : null}
			</div>
			<div className="mt-5">{children}</div>
		</section>
	);
}

const Project = () => {
	const { user } = useUserStore();
	const { userTypeLabel } = useUserTypeLabel({ userType: user?.type });
	const { projectId } = useParams<IProjectParams>();
	const navigate = useNavigate();

	const [project, setProject] = useState<IProject | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isLoadingButton, setIsLoadingButton] = useState<boolean>(false);
	const [isBuyTokensModalOpen, setIsBuyTokensModalOpen] =
		useState<boolean>(false);
	const safeTokenSymbol = project?.tokenSymbol ?? 'TOKEN';

	const handleGetProject = useCallback(async () => {
		if (!projectId) return;

		try {
			setIsLoading(true);
			const data = await projectService.getPublicProject(projectId);
			setProject(data);
		} catch (error) {
			console.error(error);
			notificationService.error('An error occurred while fetching project');
		} finally {
			setIsLoading(false);
		}
	}, [projectId]);

	const handleBuyTokens = useCallback(
		async (buyTokensFields: { amount: number; tokenAmount?: number }) => {
			if (!projectId || !project) return;

			try {
				setIsLoadingButton(true);
				await ownershipService.buyPosition({
					projectId: Number(project.id),
					seriesId: Number(project.seriesId ?? 0),
					tokenSymbol: safeTokenSymbol,
					amount: Number(buyTokensFields.tokenAmount ?? buyTokensFields.amount),
					cashAmount: Number(buyTokensFields.amount ?? 0),
					custodyType: 'regenx_custody',
					sellerWalletAddress: project.distributorWalletPublic ?? undefined,
				});

				notificationService.success(
					'Investment order submitted successfully through RegenX managed custody.',
				);
				setIsBuyTokensModalOpen(false);
				await handleGetProject();
			} catch (error) {
				console.error(error);
				notificationService.error(
					(error as Error)?.message ||
						'An error occurred while submitting the investment order',
				);
			} finally {
				setIsLoadingButton(false);
			}
		},
		[project, projectId, safeTokenSymbol, handleGetProject],
	);

	useEffect(() => {
		handleGetProject();
	}, [handleGetProject]);

	if (isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (!project) {
		return (
			<div
				className="flex h-full w-full flex-col items-center justify-center"
				data-test="project-not-found"
			>
				<h3 className="text-xl font-semibold">
					We couldn't retrieve this project
				</h3>
				<p>Please try again later.</p>
			</div>
		);
	}

	const fundingGoal = Number(project.fundingGoal ?? 0);
	const amountSettled = Number(
		project.amountSettled ?? project.fundedSoFar ?? 0,
	);
	const percentFunded = Number(project.percentFunded ?? 0);
	const investorCount = Number(project.investorCount ?? 0);
	const unitsSold = Number(project.unitsSold ?? project.purchasedAmount ?? 0);
	const remainingSupply = Number(
		project.unitsRemaining ?? project.remainingSupply ?? 0,
	);
	const tokenPrice = Number(project.tokenPrice ?? 1);
	const tokenSupply = Number(project.tokenSupply ?? 0) / SOROBAN_TOKEN_EXPONENT;

	const safeProjectName = project.name ?? 'Untitled Project';
	const safeTokenAddress = project.tokenAddress ?? '';
	const safeAssetCode = project.assetCode ?? project.tokenSymbol ?? '';
	const safeAssetIssuer = project.assetIssuer ?? '';
	const safeProjectStatus = project.status ?? 'draft';
	const tokenAssetUrl = getAssetUrl(safeAssetCode, safeAssetIssuer);
	const safeOwnerAddress = project.ownerAddress ?? '';
	const safeDescription = project.description ?? 'No description provided';
	const safeClimateImpact = project.climateImpact ?? 'Not provided';
	const safeLocation = project.location ?? 'Not provided';
	const safeMinimumInvestment =
		project.minimumInvestment?.trim() || 'Not provided';
	const safeInvestmentSummary =
		project.investmentSummary?.trim() || 'Investment summary not provided';
	const safeTargetIrr = project.targetIrr?.trim() || 'Not provided';
	const safeAnnualYield = project.targetAnnualYield?.trim() || 'Not provided';
	const safeInvestmentTerm =
		project.investmentTermYears?.trim() || 'Not provided';
	const safeProjectType = project.projectType?.trim() || 'Not provided';
	const safeDseType = project.dseType?.trim() || 'Not provided';
	const safeStage = project.stage?.trim() || 'Not provided';
	const safeJurisdiction = project.jurisdiction?.trim() || 'Not provided';
	const projectDocuments = (project.projectFiles ?? []).filter(
		(file) => file.purpose === 'PROJECT_DOCUMENT' && file.url,
	);
	const timelineLabel = formatDateRange(project.startDate, project.endDate);
	const headlineDescription =
		project.description?.trim() ||
		project.investmentSummary?.trim() ||
		`${safeProjectType} opportunity in ${safeLocation}`;
	const statusLabel = safeProjectStatus.replaceAll('_', ' ');
	const aboutParagraphs = splitParagraphs(safeDescription);
	const investmentParagraphs = splitParagraphs(safeInvestmentSummary);

	return (
		<AppPageShell data-test="project-page">
			<AppPageHeader
				eyebrow={userTypeLabel || 'Project Detail'}
				title={safeProjectName}
				description={headlineDescription}
			/>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="space-y-4">
					<section className="overflow-hidden rounded-[18px] border border-[#E7ECF4] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						<div className="grid gap-0 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
							<div className="border-b border-[#E7ECF4] bg-[linear-gradient(135deg,#F4F8FF_0%,#FFFFFF_55%,#EEF6F0_100%)] p-6 xl:border-b-0 xl:border-r">
								<div className="inline-flex rounded-[999px] bg-[#EAF2FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
									{statusLabel}
								</div>
								<h2 className="mt-4 max-w-[760px] text-[32px] font-semibold tracking-[-0.03em] text-[#163F74]">
									{safeProjectName}
								</h2>
								<p className="mt-3 max-w-[760px] text-[15px] leading-[1.7] text-[#5F6C86]">
									{safeInvestmentSummary}
								</p>

								<div className="mt-6 grid gap-3 md:grid-cols-2">
									<div className="flex items-start gap-3 rounded-[14px] border border-[#E7ECF4] bg-white/80 px-4 py-4">
										<MapPin className="mt-0.5 h-4 w-4 text-[#346FB6]" />
										<div>
											<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
												Location
											</div>
											<div className="mt-2 text-[14px] font-medium text-[#163F74]">
												{safeLocation}
											</div>
										</div>
									</div>
									<div className="flex items-start gap-3 rounded-[14px] border border-[#E7ECF4] bg-white/80 px-4 py-4">
										<CalendarDays className="mt-0.5 h-4 w-4 text-[#346FB6]" />
										<div>
											<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
												Timeline
											</div>
											<div className="mt-2 text-[14px] font-medium text-[#163F74]">
												{timelineLabel}
											</div>
										</div>
									</div>
									<div className="flex items-start gap-3 rounded-[14px] border border-[#E7ECF4] bg-white/80 px-4 py-4">
										<Leaf className="mt-0.5 h-4 w-4 text-[#346FB6]" />
										<div>
											<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
												Climate Impact
											</div>
											<div className="mt-2 text-[14px] font-medium text-[#163F74]">
												{safeClimateImpact}
											</div>
										</div>
									</div>
									<div className="flex items-start gap-3 rounded-[14px] border border-[#E7ECF4] bg-white/80 px-4 py-4">
										<ShieldCheck className="mt-0.5 h-4 w-4 text-[#346FB6]" />
										<div>
											<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
												Carbon Credits
											</div>
											<div className="mt-2 text-[14px] font-medium text-[#163F74]">
												{formatBooleanAsString(project.generatesCarbonCredits)}
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="p-6">
								<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Raise Snapshot
								</div>
								<div className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-[#163F74]">
									{formatCurrency(amountSettled)}
								</div>
								<div className="mt-1 text-[14px] text-[#5F6C86]">
									Settled against a funding goal of{' '}
									{formatCurrency(fundingGoal)}
								</div>

								<div className="mt-5">
									<div className="flex items-center justify-between text-[13px] text-[#5F6C86]">
										<span>Funding progress</span>
										<span className="font-semibold text-[#163F74]">
											{percentFunded.toFixed(0)}%
										</span>
									</div>
									<div className="mt-2 h-2.5 w-full rounded-full bg-[#E8EEF6]">
										<div
											className="h-2.5 rounded-full bg-[#2E6FD8] transition-all duration-300"
											style={{
												width: `${Math.max(0, Math.min(100, percentFunded))}%`,
											}}
										/>
									</div>
								</div>

								<div className="mt-5 grid grid-cols-2 gap-3">
									<InfoTile
										label="Investors"
										value={investorCount.toLocaleString()}
										dataTest="project-settled-investor-count"
									/>
									<InfoTile
										label="Units Sold"
										value={unitsSold.toLocaleString()}
										dataTest="raise-units-sold"
									/>
									<InfoTile
										label="Units Remaining"
										value={remainingSupply.toLocaleString()}
										dataTest="raise-units-remaining"
									/>
									<InfoTile
										label="Minimum Investment"
										value={safeMinimumInvestment}
										dataTest="raise-min-investment"
									/>
								</div>
							</div>
						</div>
					</section>

					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<MetricCard
							label="Funding Goal"
							value={formatCurrency(fundingGoal)}
							highlight
						/>
						<MetricCard
							label="Target IRR"
							value={formatMetricValue(safeTargetIrr)}
						/>
						<MetricCard
							label="Annual Yield"
							value={formatMetricValue(safeAnnualYield)}
						/>
						<MetricCard
							label="Investment Term"
							value={formatMetricValue(safeInvestmentTerm)}
						/>
					</div>

					<ContentCard
						title="Investment Summary"
						description="This section frames the opportunity in plain language for investors while staying useful for climate developers presenting the asset."
					>
						<div className="space-y-3">
							{investmentParagraphs.length > 0 ? (
								investmentParagraphs.map((paragraph) => (
									<p
										key={paragraph}
										className="text-[15px] leading-[1.75] text-[#5F6C86]"
									>
										{paragraph}
									</p>
								))
							) : (
								<p className="text-[15px] leading-[1.75] text-[#5F6C86]">
									Investment summary not provided.
								</p>
							)}
						</div>
					</ContentCard>

					<div className="grid gap-4 xl:grid-cols-2">
						<ContentCard
							title="Project Overview"
							description="Core project facts, operating context, and implementation stage."
						>
							<div className="grid gap-3 md:grid-cols-2">
								<InfoTile label="Project Type" value={safeProjectType} />
								<InfoTile label="DSE Type" value={safeDseType} />
								<InfoTile label="Stage" value={safeStage} />
								<InfoTile label="Jurisdiction" value={safeJurisdiction} />
								<InfoTile
									label="Funding Goal"
									value={formatCurrency(fundingGoal)}
									dataTest="project-funding-goal"
								/>
								<InfoTile
									label="Settled Capital"
									value={formatCurrency(amountSettled)}
									dataTest="project-settled-capital"
								/>
							</div>
						</ContentCard>

						<ContentCard
							title="Token Structure"
							description="On-platform token and issuer details remain visible for diligence and post-issuance traceability."
						>
							<div className="grid gap-3 md:grid-cols-2">
								<InfoTile
									label="Symbol"
									value={safeTokenSymbol}
									href={
										(safeProjectStatus === 'issued' ||
											safeProjectStatus === 'live') &&
										tokenAssetUrl
											? tokenAssetUrl
											: undefined
									}
									dataTest="token-symbol"
								/>
								<InfoTile
									label="Token Address"
									value={
										safeTokenAddress
											? shortenStellarAddress(safeTokenAddress)
											: 'Not available'
									}
									dataTest="token-address"
								/>
								<InfoTile
									label="Owner"
									value={
										safeOwnerAddress
											? shortenStellarAddress(safeOwnerAddress)
											: 'Not available'
									}
									dataTest="token-owner-address"
								/>
								<InfoTile
									label="Total Units"
									value={tokenSupply.toLocaleString()}
									dataTest="token-total-units"
								/>
								<InfoTile
									label="Units Remaining"
									value={remainingSupply.toLocaleString()}
									dataTest="token-units-remaining"
								/>
								<InfoTile
									label="Carbon Credits"
									value={formatBooleanAsString(project.generatesCarbonCredits)}
									dataTest="project-generates-carbon-credits"
								/>
							</div>
						</ContentCard>
					</div>

					<ContentCard
						title="Asset Narrative"
						description="The long-form project description and climate case for the asset."
					>
						<div className="grid gap-6 xl:grid-cols-2">
							<div>
								<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Description
								</div>
								<div className="mt-3 space-y-3">
									{aboutParagraphs.length > 0 ? (
										aboutParagraphs.map((paragraph) => (
											<p
												key={paragraph}
												className="text-[15px] leading-[1.75] text-[#5F6C86]"
											>
												{paragraph}
											</p>
										))
									) : (
										<p className="text-[15px] leading-[1.75] text-[#5F6C86]">
											No description provided.
										</p>
									)}
								</div>
							</div>
							<div>
								<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Climate Impact
								</div>
								<p className="mt-3 text-[15px] leading-[1.75] text-[#5F6C86]">
									{safeClimateImpact}
								</p>
							</div>
						</div>
					</ContentCard>

					<ContentCard
						title="Documents & Agreements"
						description="Offering documents remain accessible without changing any document upload or linking behavior."
					>
						{projectDocuments.length > 0 ? (
							<div className="grid gap-3 md:grid-cols-2">
								{projectDocuments.map((file) => (
									<a
										key={file.id}
										href={file.url}
										target="_blank"
										rel="noopener noreferrer"
										className="rounded-[14px] border border-[#E7ECF4] bg-[#F7F8FB] px-4 py-4 transition-colors hover:border-[#C9D8EE]"
									>
										<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
											Project Document
										</div>
										<p className="mt-2 text-[15px] font-semibold text-[#163F74]">
											{file.originalFilename}
										</p>
										<p className="mt-1 text-[13px] text-[#5F6C86]">Open file</p>
									</a>
								))}
							</div>
						) : (
							<p className="text-[15px] leading-[1.7] text-[#5F6C86]">
								No project documents uploaded yet.
							</p>
						)}
					</ContentCard>
				</div>

				<aside className="space-y-4">
					<section className="rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
						<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
							Action Panel
						</div>
						<h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#163F74]">
							Review allocation readiness
						</h2>
						<p className="mt-3 text-[14px] leading-[1.7] text-[#5F6C86]">
							Review the live offer and continue through the RegenX-managed
							investment path. Custody and settlement are handled operationally
							through the platform.
						</p>

						<div className="mt-5 space-y-3">
							<InfoTile
								label="Token Price"
								value={formatCurrency(tokenPrice)}
							/>
							<InfoTile label="Project Status" value={statusLabel} />
							<InfoTile
								label="Role Context"
								value={userTypeLabel || 'Platform user'}
							/>
						</div>

						{user?.type !== UserType.CLIMATE_DEVELOPER ? (
							<div className="mt-5 space-y-3">
								<div className="rounded-[14px] border border-[#E7ECF4] bg-[#F7F8FB] px-4 py-4 text-[14px] leading-[1.7] text-[#5F6C86]">
									Investors are onboarded through a seamless RegenX custody
									flow. No external wallet connection is required in the
									standard path.
								</div>
								<Button
									className="w-full rounded-[14px] bg-[#2E6FD8] text-white shadow-none"
									dataTest="buy-tokens-button"
									onClick={() => setIsBuyTokensModalOpen(true)}
									isLoading={isLoadingButton}
									disabled={isLoadingButton}
								>
									Invest through RegenX
								</Button>
							</div>
						) : (
							<div className="mt-5 rounded-[14px] border border-[#E7ECF4] bg-[#F7F8FB] px-4 py-4 text-[14px] leading-[1.7] text-[#5F6C86]">
								Climate developers can use this page to present the asset,
								progress, token structure, and documentation without changing
								any workflow behind the scenes.
							</div>
						)}
					</section>

					{user?.type === UserType.CLIMATE_DEVELOPER ? (
						<section className="rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Project Operations
							</div>
							<h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#163F74]">
								Monitor this raise
							</h2>
							<p className="mt-3 text-[14px] leading-[1.7] text-[#5F6C86]">
								Use the operational views below to track investor positions,
								project-level transactions, and the next layer of post-raise
								workflows.
							</p>

							<div className="mt-5 space-y-3">
								<InfoTile
									label="Investor Count"
									value={investorCount.toLocaleString()}
								/>
								<InfoTile
									label="Settled Capital"
									value={formatCurrency(amountSettled)}
								/>
								<InfoTile
									label="Funding Progress"
									value={`${percentFunded.toFixed(0)}%`}
								/>
							</div>

							<div className="mt-5 space-y-2.5">
								<Button
									dataTest="project-operations-investors-button"
									className="w-full rounded-[14px] bg-[#2E6FD8] text-white shadow-none"
									onClick={() =>
										navigate(
											`/${PATHS.PROJECT_INVESTORS}?projectId=${project.id}`,
										)
									}
								>
									View Project Investors
								</Button>
								<Button
									dataTest="project-operations-transactions-button"
									className="w-full rounded-[14px] border border-[#D5E5FA] bg-[#F8FBFF] text-[#1C4FA3] shadow-none"
									onClick={() =>
										navigate(
											project.uuid
												? `/${PATHS.DEV_TRANSACTIONS}?projectUuid=${project.uuid}`
												: `/${PATHS.DEV_TRANSACTIONS}`,
										)
									}
								>
									View Project Transactions
								</Button>
							</div>

							<div className="mt-5 rounded-[14px] border border-[#E7ECF4] bg-[#F7F8FB] px-4 py-4">
								<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
									Next Expansion Areas
								</div>
								<div className="mt-3 space-y-2 text-[14px] leading-[1.6] text-[#5F6C86]">
									<p>
										Reporting: performance and issuer updates can live here
										next.
									</p>
									<p>
										Distributions: future payout monitoring can extend from
										developer transactions.
									</p>
									<p>
										Milestones: project delivery checkpoints can be surfaced
										here without adding dead navigation.
									</p>
								</div>
							</div>
						</section>
					) : null}
				</aside>
			</div>

			<BuyTokensModal
				isOpen={isBuyTokensModalOpen}
				onSubmit={handleBuyTokens}
				closeModal={() => setIsBuyTokensModalOpen(false)}
				tokenPrice={tokenPrice}
				tokenSymbol={safeTokenSymbol}
				projectName={safeProjectName}
			/>
		</AppPageShell>
	);
};

export default Project;
