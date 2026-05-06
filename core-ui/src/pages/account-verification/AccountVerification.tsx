import {
	AlertCircle,
	Check,
	ChevronDown,
	Headphones,
	Shield,
	UploadCloud,
	Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import SumsubVerifyButton from '@/components/account-verification/SumsubVerifyButton';
import { investorVerificationService } from '@/services/investorVerification.service';
import { useUserStore } from '@/store/user.store';

type StepKey =
	| 'identity'
	| 'investor-verification'
	| 'document-upload'
	| 'final-review';

type StepStatus = 'complete' | 'in_progress' | 'pending';
type VerificationOverrideMode = 'none' | 'testnet';

type VerificationForm = {
	investorClassification: string;
	taxResidency: string;
	isPep: string;
	isPepAssociate: string;
	highRiskJurisdictionExposure: string;
	sourceOfFunds: string;
	wealthRange: string;
	investmentExperience: string;
	beneficialOwnerDeclaration: string;
	wholesaleCertificateFileName: string;
	wholesaleCertificateExpiryDate: string;
	declarationTruth: boolean;
	declarationThirdParty: boolean;
	declarationSourceOfFunds: boolean;
	declarationSanctions: boolean;
};

type VerificationRecord = {
	id?: number;
	userId?: string;
	sumsubApplicantId?: string | null;
	sumsubStatus?:
		| 'not_started'
		| 'pending'
		| 'approved'
		| 'rejected'
		| 'review_required';
	adminReviewStatus?:
		| 'pending'
		| 'approved'
		| 'rejected'
		| 'more_info_required';
	investorEligibilityStatus?: 'blocked' | 'approved' | 'suspended';
	wholesaleStatus?: 'pending' | 'approved' | 'rejected' | 'requires_more_info';
	verificationSource?: string | null;
	wholesaleVerificationSource?: string | null;
	isTestVerification?: boolean;
	testIdentityVerified?: boolean;
	testAmlApproved?: boolean;
	testWholesaleApproved?: boolean;
	testOverrideActive?: boolean;
	testInvestmentOverride?: boolean;
	testInvestmentOverrideSetAt?: string | null;
	testInvestmentOverrideSetBy?: string | null;
	testInvestmentOverrideNote?: string | null;
	eligibilitySource?: 'real_compliance' | 'test_override' | 'none';
	verificationOverrideMode?: VerificationOverrideMode;
	testnetOverrideAvailable?: boolean;
	wholesaleCertificateKey?: string | null;
	wholesaleCertificateOriginalName?: string | null;
	wholesaleCertificateExpiryDate?: string | null;
	amlAnswers?: Record<string, any> | null;
	reviewNotes?: string | null;
	reviewedAt?: string | null;
	testVerificationActive?: boolean;
};

const steps: Array<{
	key: StepKey;
	number: string;
	title: string;
	subtitle: string;
}> = [
	{
		key: 'identity',
		number: '01',
		title: 'Identity',
		subtitle: 'Sumsub',
	},
	{
		key: 'investor-verification',
		number: '02',
		title: 'AML / CTF Questionnaire',
		subtitle: 'Required',
	},
	{
		key: 'document-upload',
		number: '03',
		title: 'Wholesale Certificate',
		subtitle: 'PDF Upload',
	},
	{
		key: 'final-review',
		number: '04',
		title: 'Final Review',
		subtitle: 'Pending',
	},
];

const defaultForm: VerificationForm = {
	investorClassification: 'Wholesale Investor',
	taxResidency: 'Australia',
	isPep: '',
	isPepAssociate: '',
	highRiskJurisdictionExposure: '',
	sourceOfFunds: '',
	wealthRange: '',
	investmentExperience: '',
	beneficialOwnerDeclaration: '',
	wholesaleCertificateFileName: '',
	wholesaleCertificateExpiryDate: '',
	declarationTruth: false,
	declarationThirdParty: false,
	declarationSourceOfFunds: false,
	declarationSanctions: false,
};

const inputClass =
	'w-full rounded-xl border border-[#D6DCE5] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#0F6A99]';

function getStepStatus(currentStep: StepKey, step: StepKey): StepStatus {
	const order: StepKey[] = [
		'identity',
		'investor-verification',
		'document-upload',
		'final-review',
	];

	const currentIndex = order.indexOf(currentStep);
	const stepIndex = order.indexOf(step);

	if (stepIndex < currentIndex) return 'complete';
	if (stepIndex === currentIndex) return 'in_progress';
	return 'pending';
}

function VerificationStepItem({
	number,
	title,
	subtitle,
	status,
	isActive,
	isLast,
}: {
	number: string;
	title: string;
	subtitle: string;
	status: StepStatus;
	isActive: boolean;
	isLast: boolean;
}) {
	const circleClass =
		status === 'complete'
			? 'border-[#0B7A33] bg-[#0B7A33] text-white'
			: isActive
			? 'border-[#1D5FD1] bg-[#1D5FD1] text-white shadow-[0_0_0_8px_rgba(29,95,209,0.08)]'
			: 'border-[#E5E7EB] bg-[#F8FAFC] text-[#C0C7D4]';

	const titleClass = status === 'pending' ? 'text-[#9AA5B5]' : 'text-[#1B2F56]';

	const subtitleClass =
		status === 'complete'
			? 'text-[#0B7A33]'
			: isActive
			? 'text-[#2F5EA8]'
			: 'text-[#B0B8C5]';

	return (
		<div className="relative flex items-start gap-4">
			{!isLast ? (
				<div className="absolute left-[18px] top-9 h-[64px] w-[2px] bg-[#E6EBF2]" />
			) : null}

			<div
				className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold ${circleClass}`}
			>
				{status === 'complete' ? <Check className="h-4 w-4" /> : number}
			</div>

			<div className="pt-0.5">
				<div className={`text-[15px] font-semibold ${titleClass}`}>{title}</div>
				<div className={`mt-1 text-[12px] ${subtitleClass}`}>{subtitle}</div>
			</div>
		</div>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
			{children}
		</label>
	);
}

function SectionCard({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-[24px] border border-[#E2E8F0] bg-white p-5">
			<div className="mb-6">
				<h2 className="text-[24px] font-semibold tracking-tight text-[#0F6A99]">
					{title}
				</h2>
				{description ? (
					<p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p>
				) : null}
			</div>
			{children}
		</div>
	);
}

function InfoCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] p-4">
			<div className="flex items-start gap-3">
				<div className="mt-0.5 text-[#1D5FD1]">{icon}</div>
				<div>
					<div className="text-sm font-semibold uppercase tracking-[0.06em] text-[#0F172A]">
						{title}
					</div>
					<div className="mt-1 text-[13px] leading-5 text-[#64748B]">
						{description}
					</div>
				</div>
			</div>
		</div>
	);
}

function StatusBadge({
	label,
	tone,
}: {
	label: string;
	tone: 'neutral' | 'pending' | 'success' | 'danger';
}) {
	const toneClass =
		tone === 'success'
			? 'border-[#CDECD7] bg-[#EAF8EF] text-[#0B7A33]'
			: tone === 'danger'
			? 'border-[#F3D6E2] bg-[#FFF4F8] text-[#B4235D]'
			: tone === 'pending'
			? 'border-[#D9E7FA] bg-[#EFF6FF] text-[#1D5FD1]'
			: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]';

	return (
		<span
			className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass}`}
		>
			{label}
		</span>
	);
}

export default function AccountVerification() {
	const { user } = useUserStore();

	const [record, setRecord] = useState<VerificationRecord | null>(null);
	const [form, setForm] = useState<VerificationForm>(defaultForm);
	const [isLoading, setIsLoading] = useState(true);
	const [isSavingAml, setIsSavingAml] = useState(false);
	const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
	const [canInvest, setCanInvest] = useState<boolean | null>(null);
	// TEMPORARY TESTNET OVERRIDE
	// REMOVE BEFORE MAINNET/PRODUCTION LAUNCH
	const isTestnetOverrideActive = Boolean(
		record?.verificationOverrideMode === 'testnet' ||
			record?.testOverrideActive ||
			record?.testVerificationActive,
	);
	const shouldShowVerificationModeControl = true;

	const currentStep = useMemo<StepKey>(() => {
		if (isTestnetOverrideActive) {
			return 'final-review';
		}

		if (!record?.sumsubStatus || record.sumsubStatus === 'not_started') {
			return 'identity';
		}

		if (record.sumsubStatus === 'pending') {
			return 'identity';
		}

		if (!record.wholesaleCertificateKey) {
			return 'document-upload';
		}

		if (record.wholesaleStatus === 'approved') {
			return 'final-review';
		}

		return 'final-review';
	}, [isTestnetOverrideActive, record]);

	const stepsWithStatus = useMemo(
		() =>
			steps.map((step) => ({
				...step,
				status: getStepStatus(currentStep, step.key),
			})),
		[currentStep],
	);

	const updateField = <K extends keyof VerificationForm>(
		field: K,
		value: VerificationForm[K],
	) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const loadVerification = async () => {
		try {
			setIsLoading(true);

			const verification = await investorVerificationService.getMine();
			setRecord(verification);

			if (verification?.amlAnswers) {
				setForm((prev) => ({
					...prev,
					...verification.amlAnswers,
					wholesaleCertificateFileName:
						verification.wholesaleCertificateOriginalName ||
						prev.wholesaleCertificateFileName,
					wholesaleCertificateExpiryDate:
						verification.wholesaleCertificateExpiryDate ||
						prev.wholesaleCertificateExpiryDate,
				}));
			} else {
				setForm((prev) => ({
					...prev,
					wholesaleCertificateFileName:
						verification?.wholesaleCertificateOriginalName ||
						prev.wholesaleCertificateFileName,
					wholesaleCertificateExpiryDate:
						verification?.wholesaleCertificateExpiryDate ||
						prev.wholesaleCertificateExpiryDate,
				}));
			}

			if (user?.id) {
				const access = await investorVerificationService.canInvest(
					String(user.id),
				);
				setCanInvest(Boolean(access?.canInvest));
			}
		} catch (error) {
			console.error('Failed to load verification', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadVerification();
	}, []);

	const handleSaveAml = async () => {
		try {
			setIsSavingAml(true);

			await investorVerificationService.saveAml({
				investorClassification: form.investorClassification,
				taxResidency: form.taxResidency,
				isPep: form.isPep,
				isPepAssociate: form.isPepAssociate,
				highRiskJurisdictionExposure: form.highRiskJurisdictionExposure,
				sourceOfFunds: form.sourceOfFunds,
				wealthRange: form.wealthRange,
				investmentExperience: form.investmentExperience,
				beneficialOwnerDeclaration: form.beneficialOwnerDeclaration,
				declarationTruth: form.declarationTruth,
				declarationThirdParty: form.declarationThirdParty,
				declarationSourceOfFunds: form.declarationSourceOfFunds,
				declarationSanctions: form.declarationSanctions,
			});

			await loadVerification();
		} catch (error) {
			console.error('Failed to save AML questionnaire', error);
			alert('Failed to save AML questionnaire');
		} finally {
			setIsSavingAml(false);
		}
	};

	const handleCertificateUpload = async (file: File) => {
		if (file.type !== 'application/pdf') {
			alert('Only PDF files are allowed.');
			return;
		}

		if (!form.wholesaleCertificateExpiryDate) {
			alert('Please select the certificate expiry date first.');
			return;
		}

		try {
			setIsUploadingCertificate(true);

			const uploadConfig =
				await investorVerificationService.getWholesaleUploadUrl(
					file.name,
					file.type,
				);

			await fetch(uploadConfig.uploadUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': file.type,
				},
				body: file,
			});

			await investorVerificationService.completeWholesaleUpload({
				key: uploadConfig.key,
				originalName: file.name,
				expiryDate: form.wholesaleCertificateExpiryDate,
			});

			setForm((prev) => ({
				...prev,
				wholesaleCertificateFileName: file.name,
			}));

			await loadVerification();
		} catch (error) {
			console.error('Failed to upload wholesale certificate', error);
			alert('Failed to upload certificate');
		} finally {
			setIsUploadingCertificate(false);
		}
	};

	const sumsubTone: 'neutral' | 'pending' | 'success' | 'danger' =
		record?.sumsubStatus === 'approved'
			? 'success'
			: record?.sumsubStatus === 'rejected'
			? 'danger'
			: record?.sumsubStatus === 'pending'
			? 'pending'
			: 'neutral';

	const wholesaleTone: 'neutral' | 'pending' | 'success' | 'danger' =
		record?.wholesaleStatus === 'approved'
			? 'success'
			: record?.wholesaleStatus === 'rejected'
			? 'danger'
			: record?.wholesaleStatus === 'requires_more_info'
			? 'danger'
			: 'pending';

	const adminReviewTone: 'neutral' | 'pending' | 'success' | 'danger' =
		record?.adminReviewStatus === 'approved'
			? 'success'
			: record?.adminReviewStatus === 'rejected' ||
			  record?.adminReviewStatus === 'more_info_required'
			? 'danger'
			: 'pending';

	const eligibilityTone: 'neutral' | 'pending' | 'success' | 'danger' =
		record?.investorEligibilityStatus === 'approved'
			? 'success'
			: record?.sumsubStatus === 'approved' &&
			  record?.adminReviewStatus === 'pending'
			? 'pending'
			: 'danger';

	const showTestVerificationBanner = isTestnetOverrideActive;

	return (
		<div className="min-h-full bg-[#F8FAFC] p-5">
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
				<aside className="rounded-[28px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
					<div className="mb-8">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
							Verification Journey
						</p>
					</div>

					<div className="space-y-6">
						{stepsWithStatus.map((step, index) => (
							<VerificationStepItem
								key={step.key}
								number={step.number}
								title={step.title}
								subtitle={step.subtitle}
								status={step.status}
								isActive={step.key === currentStep}
								isLast={index === stepsWithStatus.length - 1}
							/>
						))}
					</div>

					<div className="mt-10">
						<InfoCard
							icon={<Shield className="h-4 w-4" />}
							title="Secure Portal"
							description="Sumsub handles automated identity and screening checks first. RegenX then completes a separate internal approval before investment access is enabled."
						/>
					</div>
				</aside>

				<div className="space-y-6">
					<main className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
						<div className="mb-8">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
								Onboarding
							</p>
							<h1 className="mt-1 text-[36px] font-semibold tracking-tight text-[#0F6A99]">
								Account verification
							</h1>
							<p className="mt-2 max-w-[820px] text-sm leading-6 text-[#64748B]">
								Complete identity verification through Sumsub, fill in the AML /
								CTF questionnaire, and upload your wholesale investor
								certificate before the RegenX compliance team can approve
								investment access.
							</p>
						</div>

						{isLoading ? (
							<div className="text-sm text-[#64748B]">
								Loading verification status...
							</div>
						) : (
							<div className="space-y-6">
								{shouldShowVerificationModeControl ? (
									<div className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FBFF] p-5">
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div>
												<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
													Verification Mode
												</div>
												<p className="mt-2 text-sm leading-6 text-[#5D6B84]">
													This setting is managed by RegenX admin. It shows
													whether your account is following the standard
													verification path or the temporary testnet override.
												</p>
											</div>
											{isTestnetOverrideActive ? (
												<span className="inline-flex rounded-full border border-[#FAD7C2] bg-[#FFF7F2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B54708]">
													TEST
												</span>
											) : null}
										</div>

										<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
											<label
												className={`flex cursor-default items-start gap-3 rounded-[18px] border px-4 py-4 ${
													!isTestnetOverrideActive
														? 'border-[#D9E7FA] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
														: 'border-[#E2E8F0] bg-white'
												}`}
											>
												<input
													type="radio"
													name="verification-mode"
													checked={!isTestnetOverrideActive}
													readOnly
													disabled
													className="mt-1 h-4 w-4 border-[#CBD5E1] text-[#1D5FD1]"
												/>
												<div>
													<div className="text-sm font-semibold text-[#163F74]">
														Standard verification
													</div>
													<div className="mt-1 text-sm leading-6 text-[#64748B]">
														Sumsub, AML / CTF review, and wholesale document
														checks remain required before investing is enabled.
													</div>
												</div>
											</label>

											<label
												className={`flex cursor-default items-start gap-3 rounded-[18px] border px-4 py-4 ${
													isTestnetOverrideActive
														? 'border-[#FAD7C2] bg-[#FFFDF8] shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
														: 'border-[#E2E8F0] bg-white'
												}`}
											>
												<input
													type="radio"
													name="verification-mode"
													checked={isTestnetOverrideActive}
													readOnly
													disabled
													className="mt-1 h-4 w-4 border-[#CBD5E1] text-[#B54708]"
												/>
												<div>
													<div className="flex flex-wrap items-center gap-2">
														<div className="text-sm font-semibold text-[#163F74]">
															Testnet override
														</div>
														<span className="inline-flex rounded-full border border-[#FAD7C2] bg-[#FFF7F2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B54708]">
															TEST
														</span>
													</div>
													<div className="mt-1 text-sm leading-6 text-[#64748B]">
														Testing override is enabled. Standard compliance
														checks are bypassed for this account.
													</div>
												</div>
											</label>
										</div>
									</div>
								) : null}

								{showTestVerificationBanner ? (
									<div className="rounded-[24px] border border-[#D9A441] bg-[#FFF8E8] p-5">
										<div className="flex flex-wrap items-center gap-3">
											<span className="inline-flex rounded-full border border-[#FAD7C2] bg-[#FFF7F2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B54708]">
												TEST
											</span>
											<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A6700]">
												Testnet Verification Override
											</div>
										</div>
										<p className="mt-2 text-sm leading-6 text-[#7A5A00]">
											Testnet account enabled. Sumsub and document checks are
											bypassed for testing only.
										</p>
										<p className="mt-2 text-sm leading-6 text-[#8A6A11]">
											Testing override is enabled. Standard compliance checks
											are bypassed for this account.
										</p>
										{record?.testInvestmentOverrideSetAt ? (
											<p className="mt-2 text-[13px] text-[#8A6A11]">
												Applied at {record.testInvestmentOverrideSetAt}
												{record?.testInvestmentOverrideSetBy
													? ` by ${record.testInvestmentOverrideSetBy}`
													: ''}
											</p>
										) : null}
									</div>
								) : null}

								<SectionCard
									title="Identity verification"
									description="Identity, liveness, sanctions, and PEP checks are handled through Sumsub. Sumsub approval is required first, but it does not unlock investing until RegenX admin review is also approved."
								>
									<div className="flex flex-wrap items-center gap-3">
										<StatusBadge
											label={
												record?.sumsubStatus === 'approved'
													? 'Verified'
													: record?.sumsubStatus === 'rejected'
													? 'Rejected'
													: record?.sumsubStatus === 'review_required'
													? 'Review Required'
													: record?.sumsubStatus === 'pending'
													? 'In Progress'
													: 'Not Started'
											}
											tone={sumsubTone}
										/>

										{record?.sumsubApplicantId ? (
											<div className="text-sm text-[#64748B]">
												Applicant ID{' '}
												<span className="font-medium text-[#1B2F56]">
													{record.sumsubApplicantId}
												</span>
											</div>
										) : null}
									</div>

									<div className="mt-6">
										<SumsubVerifyButton onStarted={loadVerification} />
									</div>
								</SectionCard>

								<SectionCard
									title="AML / CTF questionnaire"
									description="These questions support customer due diligence, sanctions screening, and risk assessment requirements."
								>
									<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
										<div>
											<Label>Investor Classification</Label>
											<div className="relative">
												<select
													className={`${inputClass} appearance-none pr-12`}
													value={form.investorClassification}
													onChange={(e) =>
														updateField(
															'investorClassification',
															e.target.value,
														)
													}
												>
													<option>Wholesale Investor</option>
													<option>Sophisticated Investor</option>
													<option>Professional Investor</option>
													<option>Institutional Investor</option>
												</select>
												<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
											</div>
										</div>

										<div>
											<Label>Country of Tax Residency</Label>
											<input
												className={inputClass}
												placeholder="Australia"
												value={form.taxResidency}
												onChange={(e) =>
													updateField('taxResidency', e.target.value)
												}
											/>
										</div>

										<div>
											<Label>Are you a politically exposed person (PEP)?</Label>
											<div className="relative">
												<select
													className={`${inputClass} appearance-none pr-12`}
													value={form.isPep}
													onChange={(e) => updateField('isPep', e.target.value)}
												>
													<option value="">Select an option</option>
													<option>Yes</option>
													<option>No</option>
												</select>
												<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
											</div>
										</div>

										<div>
											<Label>Are you related to or acting for a PEP?</Label>
											<div className="relative">
												<select
													className={`${inputClass} appearance-none pr-12`}
													value={form.isPepAssociate}
													onChange={(e) =>
														updateField('isPepAssociate', e.target.value)
													}
												>
													<option value="">Select an option</option>
													<option>Yes</option>
													<option>No</option>
												</select>
												<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
											</div>
										</div>

										<div>
											<Label>Exposure to High-Risk Jurisdictions</Label>
											<div className="relative">
												<select
													className={`${inputClass} appearance-none pr-12`}
													value={form.highRiskJurisdictionExposure}
													onChange={(e) =>
														updateField(
															'highRiskJurisdictionExposure',
															e.target.value,
														)
													}
												>
													<option value="">Select an option</option>
													<option>No</option>
													<option>Yes</option>
												</select>
												<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
											</div>
										</div>

										<div>
											<Label>Primary Source of Funds</Label>
											<div className="relative">
												<select
													className={`${inputClass} appearance-none pr-12`}
													value={form.sourceOfFunds}
													onChange={(e) =>
														updateField('sourceOfFunds', e.target.value)
													}
												>
													<option value="">Select an option</option>
													<option>Salary / Employment Income</option>
													<option>Business Income</option>
													<option>Investment Portfolio</option>
													<option>Sale of Assets</option>
													<option>Inheritance</option>
													<option>Other</option>
												</select>
												<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
											</div>
										</div>

										<div>
											<Label>Estimated Wealth Range</Label>
											<div className="relative">
												<select
													className={`${inputClass} appearance-none pr-12`}
													value={form.wealthRange}
													onChange={(e) =>
														updateField('wealthRange', e.target.value)
													}
												>
													<option value="">Select an option</option>
													<option>Below $100,000</option>
													<option>$100,000 to $1,000,000</option>
													<option>$1,000,000 to $5,000,000</option>
													<option>Above $5,000,000</option>
												</select>
												<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
											</div>
										</div>

										<div>
											<Label>Investment Experience</Label>
											<div className="relative">
												<select
													className={`${inputClass} appearance-none pr-12`}
													value={form.investmentExperience}
													onChange={(e) =>
														updateField('investmentExperience', e.target.value)
													}
												>
													<option value="">Select an option</option>
													<option>None</option>
													<option>Basic</option>
													<option>Advanced</option>
													<option>Professional</option>
												</select>
												<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
											</div>
										</div>

										<div className="md:col-span-2">
											<Label>Beneficial Owner / Third Party Declaration</Label>
											<input
												className={inputClass}
												placeholder="State whether you are acting on your own behalf or for another entity / beneficial owner"
												value={form.beneficialOwnerDeclaration}
												onChange={(e) =>
													updateField(
														'beneficialOwnerDeclaration',
														e.target.value,
													)
												}
											/>
										</div>
									</div>

									<div className="mt-8 flex justify-end">
										<button
											type="button"
											onClick={handleSaveAml}
											disabled={isSavingAml}
											className="rounded-xl bg-[#184F9E] px-8 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(47,128,237,0.14)] transition hover:bg-[#123F82] disabled:cursor-not-allowed disabled:opacity-60"
										>
											{isSavingAml ? 'Saving...' : 'Save AML Questionnaire'}
										</button>
									</div>
								</SectionCard>

								<SectionCard
									title="Wholesale investor certificate"
									description="Upload your Wholesale Investor Certificate (Accountant Letter) as a PDF only. RegenX admin review uses this document alongside the Sumsub result before investor access is approved."
								>
									<div className="mb-4 flex flex-wrap items-center gap-3">
										<StatusBadge
											label={
												record?.wholesaleStatus === 'approved'
													? 'Approved'
													: record?.wholesaleStatus === 'rejected'
													? 'Rejected'
													: record?.wholesaleStatus === 'requires_more_info'
													? 'More Info Required'
													: 'Pending Review'
											}
											tone={wholesaleTone}
										/>

										{record?.reviewNotes ? (
											<div className="inline-flex items-center gap-2 rounded-xl border border-[#F3D6E2] bg-[#FFF4F8] px-3 py-2 text-sm text-[#B4235D]">
												<AlertCircle className="h-4 w-4" />
												{record.reviewNotes}
											</div>
										) : null}
									</div>

									<div className="mb-5 flex flex-wrap items-center gap-3">
										<StatusBadge
											label={
												record?.adminReviewStatus === 'approved'
													? 'Admin Approved'
													: record?.adminReviewStatus === 'rejected'
													? 'Admin Rejected'
													: record?.adminReviewStatus === 'more_info_required'
													? 'More Info Required'
													: 'Admin Review Pending'
											}
											tone={adminReviewTone}
										/>

										{record?.reviewedAt ? (
											<div className="text-sm text-[#64748B]">
												Last reviewed{' '}
												<span className="font-medium text-[#1B2F56]">
													{new Date(record.reviewedAt).toLocaleString()}
												</span>
											</div>
										) : null}
									</div>

									<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
										<div>
											<Label>Certificate Expiry Date</Label>
											<input
												type="date"
												className={inputClass}
												value={form.wholesaleCertificateExpiryDate}
												onChange={(e) =>
													updateField(
														'wholesaleCertificateExpiryDate',
														e.target.value,
													)
												}
											/>
										</div>

										<div>
											<Label>Uploaded Certificate</Label>
											<div className="flex h-[50px] items-center rounded-xl border border-[#D6DCE5] bg-[#F8FAFC] px-4 text-sm text-[#334155]">
												{form.wholesaleCertificateFileName ||
													record?.wholesaleCertificateOriginalName ||
													'No certificate uploaded yet'}
											</div>
										</div>
									</div>

									<label className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#CBD5E1] bg-[#FCFDFE] px-6 text-center transition hover:bg-[#F8FBFF]">
										<input
											type="file"
											accept="application/pdf"
											className="hidden"
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													handleCertificateUpload(file);
												}
											}}
										/>

										<div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9]">
											<UploadCloud className="h-8 w-8 text-[#0F172A]" />
										</div>

										<div className="text-[15px] font-semibold text-[#0F172A]">
											Upload Wholesale Investor Certificate (Accountant Letter)
										</div>

										<div className="mt-2 max-w-[420px] text-[13px] text-[#64748B]">
											PDF only. This document is stored privately and reviewed
											before investment access is enabled.
										</div>

										{isUploadingCertificate ? (
											<div className="mt-4 text-sm font-medium text-[#2F5EA8]">
												Uploading certificate...
											</div>
										) : null}
									</label>
								</SectionCard>

								<SectionCard
									title="Legal declarations"
									description="These confirmations are required before your verification file can be submitted for review."
								>
									<div className="space-y-4">
										<label className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] p-4">
											<input
												type="checkbox"
												checked={form.declarationTruth}
												onChange={(e) =>
													updateField('declarationTruth', e.target.checked)
												}
												className="mt-1 h-4 w-4 rounded border-[#CBD5E1]"
											/>
											<span className="text-sm leading-6 text-[#334155]">
												I certify that the information and documents provided
												are true, complete, and accurate.
											</span>
										</label>

										<label className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] p-4">
											<input
												type="checkbox"
												checked={form.declarationThirdParty}
												onChange={(e) =>
													updateField('declarationThirdParty', e.target.checked)
												}
												className="mt-1 h-4 w-4 rounded border-[#CBD5E1]"
											/>
											<span className="text-sm leading-6 text-[#334155]">
												I am not acting on behalf of an undisclosed third party
												or beneficial owner.
											</span>
										</label>

										<label className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] p-4">
											<input
												type="checkbox"
												checked={form.declarationSourceOfFunds}
												onChange={(e) =>
													updateField(
														'declarationSourceOfFunds',
														e.target.checked,
													)
												}
												className="mt-1 h-4 w-4 rounded border-[#CBD5E1]"
											/>
											<span className="text-sm leading-6 text-[#334155]">
												I confirm that the source of funds and wealth used for
												investment activity is legitimate.
											</span>
										</label>

										<label className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] p-4">
											<input
												type="checkbox"
												checked={form.declarationSanctions}
												onChange={(e) =>
													updateField('declarationSanctions', e.target.checked)
												}
												className="mt-1 h-4 w-4 rounded border-[#CBD5E1]"
											/>
											<span className="text-sm leading-6 text-[#334155]">
												I confirm that neither I nor any disclosed beneficial
												owner is subject to sanctions restrictions to the best
												of my knowledge.
											</span>
										</label>
									</div>
								</SectionCard>

								<div className="rounded-[24px] border border-[#E2E8F0] bg-white p-5">
									<div className="flex flex-wrap items-start justify-between gap-4">
										<div>
											<div className="text-[18px] font-semibold text-[#163F74]">
												Investment access status
											</div>
											<p className="mt-1 text-sm text-[#64748B]">
												Sumsub approval and RegenX internal approval are both
												required before investing is enabled.
											</p>
										</div>

										<StatusBadge
											label={
												isTestnetOverrideActive
													? 'Testing Enabled'
													: record?.investorEligibilityStatus === 'approved'
													? 'Investment Enabled'
													: record?.sumsubStatus === 'approved' &&
													  record?.adminReviewStatus === 'pending'
													? 'Awaiting Admin Approval'
													: canInvest
													? 'Investment Enabled'
													: 'Investment Locked'
											}
											tone={
												isTestnetOverrideActive ||
												record?.investorEligibilityStatus === 'approved'
													? 'success'
													: eligibilityTone
											}
										/>
									</div>

									<div className="mt-4 flex flex-wrap items-center gap-3">
										{isTestnetOverrideActive ? (
											<StatusBadge label="TEST" tone="pending" />
										) : null}
										<StatusBadge
											label={
												record?.sumsubStatus === 'approved'
													? 'Sumsub Approved'
													: record?.sumsubStatus === 'review_required'
													? 'Sumsub Review Required'
													: record?.sumsubStatus === 'rejected'
													? 'Sumsub Rejected'
													: record?.sumsubStatus === 'pending'
													? 'Sumsub Pending'
													: 'Sumsub Not Started'
											}
											tone={sumsubTone}
										/>
										<StatusBadge
											label={
												record?.adminReviewStatus === 'approved'
													? 'Admin Approved'
													: record?.adminReviewStatus === 'rejected'
													? 'Admin Rejected'
													: record?.adminReviewStatus === 'more_info_required'
													? 'Admin Needs More Info'
													: 'Admin Pending'
											}
											tone={adminReviewTone}
										/>
										<StatusBadge
											label={
												record?.investorEligibilityStatus === 'approved'
													? 'Eligible To Invest'
													: 'Not Yet Eligible'
											}
											tone={eligibilityTone}
										/>
									</div>

									<div className="mt-4 text-sm text-[#64748B]">
										{isTestnetOverrideActive
											? 'Testnet account enabled. Sumsub and document checks are bypassed for testing only.'
											: record?.sumsubStatus === 'approved' &&
											  record?.adminReviewStatus === 'pending'
											? 'Your automated checks are complete. RegenX admin review is still pending, so investing remains blocked for now.'
											: record?.adminReviewStatus === 'more_info_required'
											? 'RegenX needs more information before your investor access can be approved.'
											: record?.adminReviewStatus === 'rejected'
											? 'RegenX admin review has rejected investor access. Please contact support if you need clarification.'
											: record?.investorEligibilityStatus === 'approved' ||
											  canInvest
											? 'Your verification is fully approved and investment access is enabled.'
											: 'Investing stays locked until both compliance stages are approved.'}
									</div>
								</div>
							</div>
						)}
					</main>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<InfoCard
							icon={<Zap className="h-4 w-4" />}
							title="Fast-track verification"
							description="Our compliance workflow can pre-screen uploaded records before manual review and approval."
						/>
						<InfoCard
							icon={<Headphones className="h-4 w-4" />}
							title="Institutional support"
							description="Direct line to compliance officers is available for higher-touch onboarding and entity verification."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
