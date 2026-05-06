import React, { useMemo, useRef } from 'react';

type AnyObj = Record<string, any>;

export interface FullRpaViewProps {
	form: AnyObj;
	rpaComputed?: {
		contractedRevenueAmount?: number;
		merchantRevenueAmount?: number;
		grossAnnualRevenueToSpv?: number;
		netAnnualCashflowToSpv?: number;
		monthlyDistribution?: number;
		riskFlags?: string[];
	};
	readOnly?: boolean;
	hideActions?: boolean;
	showExportPdf?: boolean;
	continueAction?: React.ReactNode;
}

function safe(value: any, fallback = '—') {
	if (value === null || value === undefined || value === '') return fallback;
	return value;
}

function num(value: any, fallback = 0) {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function formatCurrency(value: any) {
	const n = Number(value);
	if (!Number.isFinite(n)) return '0';
	return new Intl.NumberFormat('en-AU', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

function SectionCard({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
			{children}
		</div>
	);
}

export default function FullRpaView({
	form,
	rpaComputed = {},
	readOnly = false,
	hideActions = false,
	showExportPdf = false,
	continueAction,
}: FullRpaViewProps) {
	const printRef = useRef<HTMLDivElement | null>(null);

	const revenueModel = form?.revenueModel || {};
	const investorStructure = form?.investorStructure || {};
	const battery = form?.battery || {};
	const solar = form?.solar || {};

	const isBattery =
		Boolean(battery?.powerCapacityMw) ||
		String(form?.projectType || '')
			.toLowerCase()
			.includes('battery');

	const totalProjectCapexValue =
		num(form?.totalProjectCapex) ||
		num(form?.capitalStructure?.totalProjectCapex) ||
		num(form?.fundingGoal);

	const totalCapitalRaiseValue =
		num(form?.fundingGoal) ||
		num(form?.capitalStructure?.fundingGoal) ||
		totalProjectCapexValue;

	const revenueSourcesDisplay = Array.isArray(
		revenueModel?.merchantRevenueStreams,
	)
		? revenueModel.merchantRevenueStreams.join(', ')
		: safe(revenueModel?.merchantRevenueStreams);

	const riskFlags =
		Array.isArray(rpaComputed?.riskFlags) && rpaComputed.riskFlags.length > 0
			? rpaComputed.riskFlags
			: ['No material flags generated'];

	const exportFileName = useMemo(() => {
		const raw = String(
			form?.projectName || 'Revenue Participation Agreement',
		).trim();
		return raw.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
	}, [form?.projectName]);

	const handleExportPdf = () => {
		if (!printRef.current) return;

		const printWindow = window.open('', '_blank', 'width=1200,height=900');
		if (!printWindow) {
			window.alert('Popup blocked. Please allow popups to export the PDF.');
			return;
		}

		const currentStyles = Array.from(
			document.querySelectorAll('style, link[rel="stylesheet"]'),
		)
			.map((node) => node.outerHTML)
			.join('\n');

		const contentHtml = printRef.current.outerHTML;

		printWindow.document.open();
		printWindow.document.write(`
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<title>${exportFileName} - RPA</title>
					${currentStyles}
					<style>
						@page {
							size: A4;
							margin: 16mm;
						}
						html, body {
							background: white !important;
							color: #111827 !important;
							font-family: Arial, Helvetica, sans-serif;
						}
						body {
							padding: 0;
							margin: 0;
						}
						.print-shell {
							max-width: 1000px;
							margin: 0 auto;
						}
						.no-print {
							display: none !important;
						}
						.break-inside-avoid {
							break-inside: avoid;
							page-break-inside: avoid;
						}
					</style>
				</head>
				<body>
					<div class="print-shell">
						${contentHtml}
					</div>
				</body>
			</html>
		`);
		printWindow.document.close();

		printWindow.focus();

		setTimeout(() => {
			printWindow.print();
		}, 400);
	};

	return (
		<div className={readOnly ? 'opacity-95' : ''}>
			<div className="mb-4 flex items-center justify-between gap-3 no-print">
				<div>
					<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
						Revenue Participation Agreement
					</div>
					<h3 className="mt-2 text-[22px] font-semibold text-[#163F74]">
						Structured Agreement View
					</h3>
				</div>

				<div className="flex items-center gap-3">
					{readOnly ? (
						<div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
							Read only
						</div>
					) : null}

					{showExportPdf ? (
						<button
							type="button"
							onClick={handleExportPdf}
							className="rounded-[12px] border border-[#D7E3FF] bg-[#F4F8FF] px-4 py-2 text-[13px] font-semibold text-[#123DA8] shadow-[0_1px_4px_rgba(16,24,40,0.03)]"
						>
							Export PDF
						</button>
					) : null}
				</div>
			</div>

			<div ref={printRef} id="full-rpa-print-area" className="space-y-6">
				<SectionCard>
					<div className="border-b border-slate-200 pb-4">
						<h3 className="text-[22px] font-semibold text-[#111827]">
							1. Deal Overview
						</h3>
						<p className="mt-2 text-sm leading-7 text-[#64748B]">
							This section outlines the core characteristics of the underlying
							asset and the capital structure supporting the investment.
						</p>
					</div>

					<div className="mt-5 space-y-4 text-sm text-[#111827]">
						<div>
							<span className="font-semibold">Project Name:</span>{' '}
							{safe(form?.projectName)}
						</div>
						<div>
							<span className="font-semibold">Asset Type:</span>{' '}
							{safe(form?.projectType)}
						</div>
						<div>
							<span className="font-semibold">Location:</span>{' '}
							{safe(form?.siteAddress || form?.location)}
						</div>
						<div>
							<span className="font-semibold">Capacity:</span>{' '}
							{safe(isBattery ? battery?.powerCapacityMw : solar?.acCapacityMw)}
						</div>
						<div>
							<span className="font-semibold">Storage Capacity:</span>{' '}
							{safe(battery?.energyCapacityMwh)}
						</div>
						<div>
							<span className="font-semibold">Total Project Capex:</span> $
							{formatCurrency(totalProjectCapexValue)}
							<p className="mt-1 text-xs leading-6 text-[#64748B]">
								Represents the total capital required to construct and
								commission the underlying asset before platform fees.
							</p>
						</div>
						<div>
							<span className="font-semibold">Total Capital Raise:</span> $
							{formatCurrency(totalCapitalRaiseValue)}
							<p className="mt-1 text-xs leading-6 text-[#64748B]">
								Represents the total equity capital required from investors to
								fully fund the project.
							</p>
						</div>
						<div>
							<span className="font-semibold">Investment Term:</span>{' '}
							{safe(investorStructure?.maximumTermYears)}
						</div>
					</div>
				</SectionCard>

				<SectionCard>
					<div className="border-b border-slate-200 pb-4">
						<h3 className="text-[22px] font-semibold text-[#111827]">
							2. Counterparty Information
						</h3>
						<p className="mt-2 text-sm leading-7 text-[#64748B]">
							This section describes the primary revenue counterparty and the
							entity responsible for payment obligations.
						</p>
					</div>
					<div className="mt-5 space-y-4 text-sm text-[#111827]">
						<div>
							<span className="font-semibold">Host Site:</span>{' '}
							{safe(revenueModel?.hostSiteName)}
						</div>
						<div>
							<span className="font-semibold">Counterparty Type:</span>{' '}
							{safe(revenueModel?.counterpartyType)}
						</div>
						<div>
							<span className="font-semibold">Industry:</span>{' '}
							{safe(revenueModel?.industry)}
						</div>
						<div>
							<span className="font-semibold">Credit Quality:</span>{' '}
							{safe(revenueModel?.creditQuality)}
							<p className="mt-1 text-xs leading-6 text-[#64748B]">
								Indicates the assessed ability of the counterparty to meet its
								payment obligations.
							</p>
						</div>
						<div>
							<span className="font-semibold">
								Primary Offtaker / Counterparty:
							</span>{' '}
							{safe(revenueModel?.primaryCounterparty)}
						</div>
					</div>
				</SectionCard>

				<SectionCard>
					<div className="border-b border-slate-200 pb-4">
						<h3 className="text-[22px] font-semibold text-[#111827]">
							3. Agreement Terms
						</h3>
						<p className="mt-2 text-sm leading-7 text-[#64748B]">
							This section defines the contractual structure governing how
							revenue is generated and distributed.
						</p>
					</div>
					<div className="mt-5 space-y-4 text-sm text-[#111827]">
						<div>
							<span className="font-semibold">Revenue Structure:</span>{' '}
							{safe(revenueModel?.selectedStructure)}
							<p className="mt-1 text-xs leading-6 text-[#64748B]">
								Determines whether cashflows are derived from site savings,
								total project revenue participation, or a hybrid of both.
							</p>
						</div>
						<div>
							<span className="font-semibold">Agreement Type:</span>{' '}
							{safe(revenueModel?.agreementType)}
						</div>
						<div>
							<span className="font-semibold">Contract Length:</span>{' '}
							{safe(revenueModel?.contractLengthYears)}
						</div>
						<div>
							<span className="font-semibold">Payment Terms:</span>{' '}
							{safe(revenueModel?.paymentFrequency)} /{' '}
							{safe(revenueModel?.paymentDelayDays, '0')} days
							<p className="mt-1 text-xs leading-6 text-[#64748B]">
								Indicates how often payments are expected to be made and the
								timing delay between invoice and receipt.
							</p>
						</div>
						<div>
							<span className="font-semibold">Baseline Method:</span>{' '}
							{safe(revenueModel?.baselineMethod)}
						</div>
						<div>
							<span className="font-semibold">Escalation:</span>{' '}
							{safe(revenueModel?.escalationPct)}
						</div>
						<div>
							<span className="font-semibold">Termination Trigger:</span>{' '}
							{safe(investorStructure?.terminationTrigger)}
						</div>
					</div>
				</SectionCard>

				<SectionCard>
					<div className="border-b border-slate-200 pb-4">
						<h3 className="text-[22px] font-semibold text-[#111827]">
							4. Revenue Structure
						</h3>
						<p className="mt-2 text-sm leading-7 text-[#64748B]">
							This section provides a breakdown of how the asset generates
							income across contracted and merchant sources.
						</p>
					</div>
					<div className="mt-5 space-y-4 text-sm text-[#111827]">
						<div>
							<span className="font-semibold">Contracted Revenue:</span> $
							{formatCurrency(rpaComputed?.contractedRevenueAmount)}
						</div>
						<div>
							<span className="font-semibold">Merchant Revenue:</span> $
							{formatCurrency(rpaComputed?.merchantRevenueAmount)}
						</div>
						<div>
							<span className="font-semibold">Revenue Sources:</span>{' '}
							{safe(revenueSourcesDisplay)}
						</div>
						<div>
							<span className="font-semibold">Aggregator Name:</span>{' '}
							{safe(revenueModel?.aggregatorName)}
						</div>
						<div>
							<span className="font-semibold">Aggregator Fee:</span>{' '}
							{safe(revenueModel?.aggregatorFeePct)}
							<p className="mt-1 text-xs leading-6 text-[#64748B]">
								Reflects the percentage of merchant-linked revenue payable to
								the operating or dispatch intermediary.
							</p>
						</div>
					</div>
				</SectionCard>

				<SectionCard>
					<div className="border-b border-slate-200 pb-4">
						<h3 className="text-[22px] font-semibold text-[#111827]">
							5. SPV Cashflow
						</h3>
						<p className="mt-2 text-sm leading-7 text-[#64748B]">
							This section summarises the flow of funds through the project’s
							SPV, from gross revenue generation to net distributable income.
						</p>
					</div>
					<div className="mt-5 space-y-4 text-sm text-[#111827]">
						<div>
							<span className="font-semibold">
								Gross Annual Revenue to SPV:
							</span>{' '}
							${formatCurrency(rpaComputed?.grossAnnualRevenueToSpv)}
						</div>
						<div>
							<span className="font-semibold">Net Annual Cashflow to SPV:</span>{' '}
							${formatCurrency(rpaComputed?.netAnnualCashflowToSpv)}
						</div>
						<div>
							<span className="font-semibold">Monthly Distribution:</span> $
							{formatCurrency(rpaComputed?.monthlyDistribution)}
							<p className="mt-1 text-xs leading-6 text-[#64748B]">
								Illustrates the indicative monthly amount available for
								distribution based on projected annual SPV cashflows.
							</p>
						</div>
						<div>
							<span className="font-semibold">Target Cash Return:</span>{' '}
							{investorStructure?.returnType === 'Multiple'
								? safe(investorStructure?.targetReturnMultiple)
								: investorStructure?.returnType === 'IRR'
								? `${safe(investorStructure?.targetIrrExpectation)}%`
								: `${safe(investorStructure?.targetAnnualYieldExpectation)}%`}
						</div>
					</div>
				</SectionCard>

				<SectionCard>
					<div className="border-b border-slate-200 pb-4">
						<h3 className="text-[22px] font-semibold text-[#111827]">
							6. Investor Returns
						</h3>
						<p className="mt-2 text-sm leading-7 text-[#64748B]">
							This section outlines the expected financial outcomes for
							investors based on the defined structure and projected cashflows.
						</p>
					</div>
					<div className="mt-5 space-y-4 text-sm text-[#111827]">
						<div>
							<span className="font-semibold">Return Type:</span>{' '}
							{safe(investorStructure?.returnType)}
						</div>
						<div>
							<span className="font-semibold">Target Multiple:</span>{' '}
							{safe(investorStructure?.targetReturnMultiple)}
						</div>
						<div>
							<span className="font-semibold">Implied IRR:</span>{' '}
							{safe(investorStructure?.targetIrrExpectation)}
						</div>
						<div>
							<span className="font-semibold">Estimated Duration:</span>{' '}
							{safe(investorStructure?.maximumTermYears)}
						</div>
						<div>
							<span className="font-semibold">Total Return:</span>{' '}
							{investorStructure?.returnType === 'Yield'
								? `${safe(investorStructure?.targetAnnualYieldExpectation)}%`
								: safe(
										investorStructure?.targetReturnMultiple ||
											investorStructure?.targetIrrExpectation,
								  )}
						</div>
						<div>
							<span className="font-semibold">Distribution Frequency:</span>{' '}
							{safe(investorStructure?.distributionFrequency)}
						</div>
					</div>
				</SectionCard>

				<SectionCard>
					<div className="border-b border-slate-200 pb-4">
						<h3 className="text-[22px] font-semibold text-[#111827]">
							7. Risk Considerations
						</h3>
						<p className="mt-2 text-sm leading-7 text-[#64748B]">
							This section highlights key risk factors identified within the
							structure.
						</p>
					</div>
					<ul className="mt-5 list-disc space-y-3 pl-6 text-sm text-[#111827]">
						{riskFlags.map((flag) => (
							<li key={flag}>{flag}</li>
						))}
					</ul>
				</SectionCard>

				<div className="rounded-[16px] border border-slate-200 bg-slate-50 px-6 py-6 break-inside-avoid">
					<h3 className="mb-3 text-[16px] font-semibold text-[#111827]">
						Agreement Basis & Disclaimer
					</h3>
					<p className="text-[13px] leading-7 text-[#475569]">
						This Revenue Participation Agreement summary has been generated
						based on the project inputs provided and reflects the intended
						structure of the investment. It is designed to present the key
						commercial and financial terms in a clear and consistent format for
						review. This document does not constitute a legally binding
						agreement. Final terms will be defined in formal transaction
						documents and may be subject to change following legal, financial,
						and technical due diligence.
					</p>
				</div>
			</div>

			{!hideActions && continueAction ? (
				<div className="mt-8 no-print">{continueAction}</div>
			) : null}
		</div>
	);
}
