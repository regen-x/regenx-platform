import type { IProject } from '@/interfaces/api/IProject';

type LifecycleStepState =
	| 'completed'
	| 'current'
	| 'inactive'
	| 'warning'
	| 'error';

type LifecycleStep = {
	key:
		| 'submitted'
		| 'changes_requested'
		| 'approved'
		| 'issued'
		| 'live'
		| 'rejected';
	label: string;
	description: string;
	state: LifecycleStepState;
	timestamp?: string | null;
};

type LifecycleTone = 'blue' | 'amber' | 'red' | 'gray';

export type ProjectLifecycleStatusCardProps = {
	project?: Partial<IProject> | null;
	status?: string | null;
	submittedAt?: string | null;
	approvedAt?: string | null;
	rejectedAt?: string | null;
	issuedAt?: string | null;
	liveAt?: string | null;
	issuanceStatus?: string | null;
	issuanceFailureReason?: string | null;
	hasRequestedChanges?: boolean;
	adminNotes?: string | null;
	readonly?: boolean;
	showHelperText?: boolean;
	compact?: boolean;
	className?: string;
	title?: string;
};

type LifecycleSummary = {
	tone: LifecycleTone;
	badgeLabel: string;
	helperText: string;
	steps: LifecycleStep[];
};

function normalizeStatus(value?: string | null) {
	return String(value || 'draft')
		.trim()
		.toLowerCase();
}

function normalizeIssuanceStatus(value?: string | null) {
	return String(value || 'not_started')
		.trim()
		.toLowerCase();
}

function formatDateLabel(value?: string | null) {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString();
}

function getCardToneClasses(tone: LifecycleTone) {
	if (tone === 'blue') {
		return {
			badge:
				'border-[#D9E7FF] bg-[#EEF4FF] text-[#1D4ED8] dark:border-[#264A8A] dark:bg-[#11213E] dark:text-[#8FB5FF]',
			helper:
				'border-[#D9E7FF] bg-[#F6F9FF] text-[#1849A9] dark:border-[#264A8A] dark:bg-[#0F1D34] dark:text-[#A7C1FF]',
		};
	}

	if (tone === 'amber') {
		return {
			badge:
				'border-[#F4D8A8] bg-[#FFF8EB] text-[#B26B00] dark:border-[#7A581C] dark:bg-[#2A2113] dark:text-[#F3C97A]',
			helper:
				'border-[#F4D8A8] bg-[#FFF9F0] text-[#9A6700] dark:border-[#7A581C] dark:bg-[#2C2111] dark:text-[#F3C97A]',
		};
	}

	if (tone === 'red') {
		return {
			badge:
				'border-[#F3D2D2] bg-[#FFF5F5] text-[#B42318] dark:border-[#7A2E2E] dark:bg-[#2D1618] dark:text-[#FF9B9B]',
			helper:
				'border-[#F3D2D2] bg-[#FFF7F7] text-[#B42318] dark:border-[#7A2E2E] dark:bg-[#301618] dark:text-[#FF9B9B]',
		};
	}

	return {
		badge:
			'border-[#E4E7EC] bg-[#F8FAFC] text-[#475467] dark:border-[#334155] dark:bg-[#111827] dark:text-[#CBD5E1]',
		helper:
			'border-[#E4E7EC] bg-[#FCFCFD] text-[#667085] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#CBD5E1]',
	};
}

function getStepClasses(state: LifecycleStepState) {
	if (state === 'completed' || state === 'current') {
		return {
			node: 'border-[#2F6FDB] bg-[#2F6FDB] text-white dark:border-[#5B9BFF] dark:bg-[#5B9BFF] dark:text-[#081120]',
			line: 'bg-[#B7CDF5] dark:bg-[#335C9A]',
			title: 'text-[#163F74] dark:text-[#E2E8F0]',
			description: 'text-[#5F6C86] dark:text-[#94A3B8]',
		};
	}

	if (state === 'warning') {
		return {
			node: 'border-[#E7A83D] bg-[#FFF3DE] text-[#A65D00] dark:border-[#E7A83D] dark:bg-[#34260E] dark:text-[#F6C56F]',
			line: 'bg-[#F4D8A8] dark:bg-[#6F5622]',
			title: 'text-[#8A5A00] dark:text-[#F6C56F]',
			description: 'text-[#8C6B2E] dark:text-[#D7B77A]',
		};
	}

	if (state === 'error') {
		return {
			node: 'border-[#E35D5D] bg-[#FFF0F0] text-[#B42318] dark:border-[#E35D5D] dark:bg-[#391618] dark:text-[#FF9B9B]',
			line: 'bg-[#F1C1C1] dark:bg-[#7A2E2E]',
			title: 'text-[#B42318] dark:text-[#FF9B9B]',
			description: 'text-[#9E3C36] dark:text-[#E2A4A0]',
		};
	}

	return {
		node: 'border-[#D7DFEA] bg-white text-[#98A2B3] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#64748B]',
		line: 'bg-[#E7ECF4] dark:bg-[#1E293B]',
		title: 'text-[#98A2B3] dark:text-[#64748B]',
		description: 'text-[#A9B4C6] dark:text-[#475569]',
	};
}

function buildLifecycleSummary({
	status,
	submittedAt,
	approvedAt,
	rejectedAt,
	issuedAt,
	liveAt,
	issuanceStatus,
	hasRequestedChanges,
	readonly,
	issuanceFailureReason,
}: {
	status?: string | null;
	submittedAt?: string | null;
	approvedAt?: string | null;
	rejectedAt?: string | null;
	issuedAt?: string | null;
	liveAt?: string | null;
	issuanceStatus?: string | null;
	hasRequestedChanges?: boolean;
	readonly?: boolean;
	issuanceFailureReason?: string | null;
}): LifecycleSummary {
	const normalizedStatus = normalizeStatus(status);
	const normalizedIssuanceStatus = normalizeIssuanceStatus(issuanceStatus);

	const isRejected = normalizedStatus === 'rejected' || Boolean(rejectedAt);
	const isLocked = normalizedStatus === 'locked';
	const hasSubmission =
		Boolean(submittedAt) ||
		[
			'under_review',
			'changes_requested',
			'approved',
			'issued',
			'live',
			'locked',
			'rejected',
		].includes(normalizedStatus) ||
		Boolean(approvedAt) ||
		Boolean(issuedAt) ||
		Boolean(liveAt);
	const isUnderReview = normalizedStatus === 'under_review';
	const isChangesRequested =
		normalizedStatus === 'changes_requested' || Boolean(hasRequestedChanges);
	const isApproved = normalizedStatus === 'approved' || Boolean(approvedAt);
	const isIssued =
		normalizedStatus === 'issued' ||
		normalizedStatus === 'live' ||
		Boolean(issuedAt) ||
		normalizedIssuanceStatus === 'completed';
	const isLive = normalizedStatus === 'live' || Boolean(liveAt);
	const issuanceFailed = normalizedIssuanceStatus === 'failed';

	const steps: LifecycleStep[] = [
		{
			key: 'submitted',
			label: 'Submitted',
			description: 'Project delivered for admin review.',
			state: hasSubmission
				? isUnderReview
					? 'current'
					: 'completed'
				: 'inactive',
			timestamp: submittedAt,
		},
		{
			key: 'changes_requested',
			label: 'Requested Changes',
			description: 'Developer revision required before resubmission.',
			state: isChangesRequested ? 'warning' : 'inactive',
		},
		{
			key: 'approved',
			label: 'Approved',
			description: 'Approved for issuance readiness.',
			state:
				isApproved || isIssued || isLive || issuanceFailed
					? normalizedStatus === 'approved'
						? 'current'
						: 'completed'
					: 'inactive',
			timestamp: approvedAt,
		},
		{
			key: 'issued',
			label: 'Issued',
			description: issuanceFailed
				? 'Issuance failed and requires review.'
				: 'Token issuance completed.',
			state: issuanceFailed
				? 'error'
				: isIssued
				? isLive
					? 'completed'
					: 'current'
				: 'inactive',
			timestamp: issuedAt,
		},
		{
			key: 'live',
			label: 'Live',
			description: 'Project is investable and visible to investors.',
			state: isLive ? 'current' : 'inactive',
			timestamp: liveAt,
		},
		{
			key: 'rejected',
			label: 'Rejected',
			description: 'Review ended without approval.',
			state: isRejected ? 'error' : 'inactive',
			timestamp: rejectedAt,
		},
	];

	if (isRejected) {
		return {
			tone: 'red',
			badgeLabel: 'Rejected',
			helperText:
				'This project has been rejected. Review feedback before continuing.',
			steps,
		};
	}

	if (isLocked) {
		return {
			tone: 'gray',
			badgeLabel: 'Locked',
			helperText:
				'This project is locked. Lifecycle progression is paused until it is unlocked.',
			steps,
		};
	}

	if (issuanceFailed) {
		return {
			tone: 'red',
			badgeLabel: 'Issuance Failed',
			helperText: issuanceFailureReason
				? `Issuance failed: ${issuanceFailureReason}`
				: 'Issuance failed. Review the details and retry once the issuance prerequisites are corrected.',
			steps,
		};
	}

	if (isLive) {
		return {
			tone: 'blue',
			badgeLabel: 'Live',
			helperText:
				'This project is live and available in the investment workflow.',
			steps,
		};
	}

	if (isIssued) {
		return {
			tone: 'blue',
			badgeLabel: 'Issued',
			helperText:
				'This project has been issued and is ready for live activation.',
			steps,
		};
	}

	if (isApproved) {
		return {
			tone: 'blue',
			badgeLabel: 'Approved',
			helperText: 'This project has been approved and is awaiting issuance.',
			steps,
		};
	}

	if (isChangesRequested) {
		return {
			tone: 'amber',
			badgeLabel: 'Changes Requested',
			helperText:
				'Changes have been requested. Update the project and resubmit for review.',
			steps,
		};
	}

	if (hasSubmission || isUnderReview) {
		return {
			tone: 'blue',
			badgeLabel: 'Under Review',
			helperText: readonly
				? 'This project has been submitted and is currently under review. Fields are locked.'
				: 'This project has been submitted and is currently under review.',
			steps,
		};
	}

	return {
		tone: 'gray',
		badgeLabel: 'Draft',
		helperText:
			'Complete the workflow sections and submit when the project is ready for review.',
		steps,
	};
}

function joinClassNames(...parts: Array<string | undefined | false>) {
	return parts.filter(Boolean).join(' ');
}

export default function ProjectLifecycleStatusCard({
	project,
	status,
	submittedAt,
	approvedAt,
	rejectedAt,
	issuedAt,
	liveAt,
	issuanceStatus,
	issuanceFailureReason,
	hasRequestedChanges,
	adminNotes,
	readonly = false,
	showHelperText = true,
	compact = false,
	className,
	title = 'Project Lifecycle',
}: ProjectLifecycleStatusCardProps) {
	const payloadFailureReason = String(
		((project?.payloadJson as Record<string, unknown> | undefined)
			?.issuanceFailureReason ??
			'') ||
			'',
	).trim();
	const summary = buildLifecycleSummary({
		status: status ?? project?.status,
		submittedAt: submittedAt ?? project?.submittedAt,
		approvedAt: approvedAt ?? project?.approvedAt,
		rejectedAt: rejectedAt ?? project?.rejectedAt,
		issuedAt: issuedAt ?? project?.issuedAt,
		liveAt: liveAt ?? project?.liveAt,
		issuanceStatus: issuanceStatus ?? project?.issuanceStatus,
		issuanceFailureReason:
			issuanceFailureReason ??
			project?.issuanceFailureReason ??
			payloadFailureReason,
		hasRequestedChanges,
		readonly,
	});
	const tones = getCardToneClasses(summary.tone);
	const notes = String(adminNotes ?? project?.adminNotes ?? '').trim();

	return (
		<div
			className={joinClassNames(
				'rounded-[28px] border border-[#E2E8F0] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900',
				compact ? 'p-4' : 'p-5 md:p-6',
				className,
			)}
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3] dark:text-slate-400">
						Workflow Status
					</div>
					<h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-[#163F74] dark:text-slate-100">
						{title}
					</h3>
				</div>
				<div
					className={joinClassNames(
						'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold',
						tones.badge,
					)}
				>
					{summary.badgeLabel}
				</div>
			</div>

			{showHelperText ? (
				<div
					className={joinClassNames(
						'mt-4 rounded-[18px] border px-4 py-3 text-[13px] leading-[1.65]',
						tones.helper,
					)}
				>
					<div>{summary.helperText}</div>
					{notes &&
					(summary.tone === 'amber' ||
						summary.tone === 'red' ||
						summary.badgeLabel === 'Under Review') ? (
						<div className="mt-2 text-[12px] opacity-90">
							<span className="font-semibold">Admin notes:</span> {notes}
						</div>
					) : null}
				</div>
			) : null}

			<div
				className={joinClassNames(
					'grid grid-cols-1 gap-3',
					compact ? 'mt-4' : 'mt-5',
				)}
			>
				{summary.steps.map((step, index) => {
					const stepStyles = getStepClasses(step.state);
					const isLast = index === summary.steps.length - 1;
					const formattedTimestamp = formatDateLabel(step.timestamp);
					return (
						<div key={step.key} className="flex gap-3">
							<div className="flex flex-col items-center">
								<div
									className={joinClassNames(
										'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold',
										stepStyles.node,
									)}
								>
									{index + 1}
								</div>
								{!isLast ? (
									<div
										className={joinClassNames(
											'mt-2 h-full min-h-[24px] w-[2px]',
											stepStyles.line,
										)}
									/>
								) : null}
							</div>
							<div className="min-w-0 pb-3">
								<div
									className={joinClassNames(
										'text-sm font-semibold',
										stepStyles.title,
									)}
								>
									{step.label}
								</div>
								<div
									className={joinClassNames(
										'mt-1 text-[12px] leading-[1.6]',
										stepStyles.description,
									)}
								>
									{step.description}
								</div>
								{formattedTimestamp ? (
									<div className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#98A2B3] dark:text-slate-500">
										{formattedTimestamp}
									</div>
								) : null}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
