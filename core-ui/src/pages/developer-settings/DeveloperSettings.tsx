import { useEffect, useState } from 'react';

import { AdminPageHeader } from '@/components/admin-ui';
import Button from '@/components/common/button';
import AppPageShell from '@/components/layout/AppPageShell';
import BaseModal from '@/components/modal/base-modal';
import { useSimpleSigner } from '@/hooks/stellar/useSimpleSigner';
import {
	CustodyMode,
	DeveloperSettingsSummary,
	UpdateDeveloperCompanyDetailsPayload,
	developerSettingsService,
} from '@/services/developer-settings.service';
import { developerProfileService } from '@/services/developerProfile.service';
import { notificationService } from '@/services/notification.service';
import { useStellarStore } from '@/store/stellar.store';

type CompanyFormState = UpdateDeveloperCompanyDetailsPayload;

const inputClass =
	'w-full rounded-xl border border-[#D6DCE5] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#0F6A99]';

const textAreaClass = `${inputClass} min-h-[120px] resize-y`;

const emptyCompanyForm: CompanyFormState = {
	legalEntityName: '',
	tradingName: '',
	abn: '',
	acn: '',
	contactName: '',
	contactEmail: '',
	phone: '',
	website: '',
	registeredAddress: '',
	businessDescription: '',
};

function SectionCard({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-[24px] border border-[#E3E8EF] bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
			<div className="border-b border-[#EEF2F7] pb-5">
				<h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#12385B]">
					{title}
				</h2>
				<p className="mt-2 max-w-[760px] text-sm leading-6 text-[#5F6C86]">
					{description}
				</p>
			</div>
			<div className="pt-5">{children}</div>
		</section>
	);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
			{children}
		</label>
	);
}

function ValueCard({
	label,
	value,
	dataTest,
}: {
	label: string;
	value: string;
	dataTest?: string;
}) {
	return (
		<div
			className="rounded-2xl border border-[#E5EBF3] bg-[#FAFCFF] px-4 py-4"
			data-test={dataTest}
		>
			<div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#71829B]">
				{label}
			</div>
			<div className="mt-2 text-sm font-medium text-[#16324F]">{value}</div>
		</div>
	);
}

function formatTimestamp(value?: string | null) {
	if (!value) return 'Not available';
	return new Date(value).toLocaleString();
}

function formatCustodyMode(mode: CustodyMode) {
	if (mode === 'self_custody') return 'Legacy wallet record';
	return 'Managed by RegenX';
}

function mapCompanyForm(
	summary?: DeveloperSettingsSummary | null,
): CompanyFormState {
	if (!summary) return emptyCompanyForm;

	return {
		legalEntityName: summary.companyDetails.legalEntityName ?? '',
		tradingName: summary.companyDetails.tradingName ?? '',
		abn: summary.companyDetails.abn ?? '',
		acn: summary.companyDetails.acn ?? '',
		contactName: summary.companyDetails.contactName ?? '',
		contactEmail: summary.companyDetails.contactEmail ?? '',
		phone: summary.companyDetails.phone ?? '',
		website: summary.companyDetails.website ?? '',
		registeredAddress: summary.companyDetails.registeredAddress ?? '',
		businessDescription: summary.companyDetails.businessDescription ?? '',
	};
}

function coalesceText(...values: unknown[]) {
	for (const value of values) {
		if (typeof value === 'string' && value.trim()) return value;
	}

	return null;
}

function mapLegacyProfileToSummary(
	profile: any,
	sessionWallet: string,
): DeveloperSettingsSummary {
	const payload = profile?.payloadJson ?? {};
	const walletAddress = coalesceText(
		profile?.primaryWalletAddress,
		profile?.walletAddress,
		payload?.walletAddress,
		sessionWallet,
	);

	return {
		companyDetails: {
			legalEntityName: coalesceText(
				profile?.legalEntityName,
				profile?.businessName,
				payload?.legalEntityName,
				payload?.businessName,
			),
			tradingName: coalesceText(
				profile?.tradingName,
				profile?.businessName,
				payload?.tradingName,
				payload?.businessName,
			),
			abn: coalesceText(profile?.abn, payload?.abn),
			acn: coalesceText(profile?.acn, payload?.acn),
			contactName: coalesceText(
				profile?.contactName,
				profile?.representativeFullName,
				payload?.contactName,
				payload?.representativeFullName,
			),
			contactEmail: coalesceText(
				profile?.contactEmail,
				profile?.representativeEmail,
				payload?.contactEmail,
				payload?.representativeEmail,
			),
			phone: coalesceText(
				profile?.phone,
				profile?.representativePhone,
				payload?.phone,
				payload?.representativePhone,
			),
			website: coalesceText(profile?.website, payload?.website),
			registeredAddress: coalesceText(
				profile?.registeredAddress,
				profile?.registeredOfficeAddress,
				payload?.registeredAddress,
				payload?.registeredOfficeAddress,
			),
			businessDescription: coalesceText(
				profile?.businessDescription,
				payload?.businessDescription,
			),
			verificationStatus: profile?.status ?? 'draft',
			submittedAt: profile?.submittedAt ?? null,
			approvedAt: profile?.approvedAt ?? null,
			rejectedAt: profile?.rejectedAt ?? null,
			adminNotes: profile?.adminNotes ?? null,
		},
		wallet: {
			custodyMode: profile?.custodyMode ?? 'regenx_custody',
			primaryWalletAddress: walletAddress,
			walletStatus: walletAddress ? 'configured' : 'not_configured',
			walletConnectionState: walletAddress ? 'connected' : 'disconnected',
			walletLabel: coalesceText(profile?.walletLabel, payload?.walletLabel),
			lastUpdatedAt:
				profile?.walletLastUpdatedAt ??
				profile?.walletConnectedAt ??
				profile?.updatedAt ??
				null,
			walletConnectedAt: profile?.walletConnectedAt ?? null,
			custodyChangeStatus: profile?.custodyChangeStatus ?? 'none',
			custodyChangeRequestedAt: profile?.custodyChangeRequestedAt ?? null,
			requestedCustodyMode: profile?.custodyChangeRequestedMode ?? null,
			requiresComplianceReview: true,
			hasExistingLiveProjects: false,
			liveProjectCount: 0,
			explanatoryCopy: {
				selfCustody:
					'Legacy self-custody records remain visible only where older operational data still references them.',
				regenxCustody:
					'Custody and settlement are managed through the platform by default.',
				warning:
					'Wallet records remain available for platform operations, issuance support, and future compatibility.',
			},
		},
		entityLinkage: {
			primaryLegalEntity: coalesceText(
				profile?.legalEntityName,
				profile?.businessName,
				payload?.legalEntityName,
				'Not yet linked',
			) as string,
			operatingEntity: coalesceText(
				profile?.tradingName,
				profile?.businessName,
				payload?.tradingName,
				'Not yet linked',
			) as string,
			linkedSpvName: coalesceText(payload?.spvName, 'Not yet linked') as string,
			linkedSpvStatus: 'Not yet linked',
			offeringRole: coalesceText(
				payload?.entityType,
				'Not yet linked',
			) as string,
			relatedProjects: [],
		},
	};
}

export default function DeveloperSettings() {
	const [summary, setSummary] = useState<DeveloperSettingsSummary | null>(null);
	const [companyForm, setCompanyForm] =
		useState<CompanyFormState>(emptyCompanyForm);
	const [companyErrors, setCompanyErrors] = useState<
		Partial<Record<keyof CompanyFormState, string>>
	>({});
	const [isLoading, setIsLoading] = useState(true);
	const [pageError, setPageError] = useState('');
	const [companySaveState, setCompanySaveState] = useState<
		'idle' | 'saving' | 'saved'
	>('idle');
	const [walletSaveState, setWalletSaveState] = useState<'idle' | 'saving'>(
		'idle',
	);
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [walletAddressDraft, setWalletAddressDraft] = useState('');
	const [walletLabelDraft, setWalletLabelDraft] = useState('');
	const [walletFormError, setWalletFormError] = useState('');

	const { publicKey } = useStellarStore();
	const { handleConnectWallet, loading: walletConnectLoading } =
		useSimpleSigner();

	useEffect(() => {
		let mounted = true;

		const loadSettings = async () => {
			try {
				setIsLoading(true);
				setPageError('');
				let response: DeveloperSettingsSummary;

				try {
					response = await developerSettingsService.getSummary();
				} catch (error: any) {
					const legacyProfile = await developerProfileService.getMine();
					response = mapLegacyProfileToSummary(legacyProfile, publicKey);

					if (!mounted) return;

					console.warn(
						'Falling back to legacy developer profile payload for settings.',
						error,
					);
				}

				if (!mounted) return;

				setSummary(response);
				setCompanyForm(mapCompanyForm(response));
			} catch (error: any) {
				if (!mounted) return;
				const message =
					(Array.isArray(error?.response?.data?.message)
						? error.response.data.message.join(', ')
						: error?.response?.data?.message) ||
					error?.message ||
					'Failed to load developer settings.';
				setPageError(message);
			} finally {
				if (mounted) setIsLoading(false);
			}
		};

		loadSettings();

		return () => {
			mounted = false;
		};
	}, [publicKey]);

	const wallet = summary?.wallet;
	const entityLinkage = summary?.entityLinkage;
	const hasSessionWallet = Boolean(publicKey);
	const effectiveSessionWallet =
		publicKey || wallet?.primaryWalletAddress || '';

	const onCompanyFieldChange =
		(field: keyof CompanyFormState) =>
		(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const nextValue = event.target.value;
			setCompanySaveState('idle');
			setCompanyErrors((current) => ({ ...current, [field]: '' }));
			setCompanyForm((current) => ({
				...current,
				[field]: nextValue,
			}));
		};

	const validateCompanyForm = () => {
		const nextErrors: Partial<Record<keyof CompanyFormState, string>> = {};

		if (!companyForm.legalEntityName.trim()) {
			nextErrors.legalEntityName = 'Legal entity name is required.';
		}

		if (!companyForm.contactName.trim()) {
			nextErrors.contactName = 'Contact name is required.';
		}

		if (!companyForm.contactEmail.trim()) {
			nextErrors.contactEmail = 'Contact email is required.';
		} else if (
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.contactEmail.trim())
		) {
			nextErrors.contactEmail = 'Enter a valid email address.';
		}

		setCompanyErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSaveCompanyDetails = async () => {
		if (!validateCompanyForm()) {
			return;
		}

		try {
			setCompanySaveState('saving');
			const updated = await developerSettingsService.updateCompanyDetails(
				companyForm,
			);
			setSummary((current) =>
				current
					? {
							...current,
							companyDetails: updated,
					  }
					: current,
			);
			setCompanySaveState('saved');
			notificationService.success('Company details updated.');
		} catch (error: any) {
			setCompanySaveState('idle');
			notificationService.error(
				error?.response?.data?.message || 'Failed to update company details.',
			);
		}
	};

	const openWalletModal = () => {
		setWalletAddressDraft(effectiveSessionWallet);
		setWalletLabelDraft(wallet?.walletLabel ?? '');
		setWalletFormError('');
		setWalletModalOpen(true);
	};

	const handleConnectWalletClick = async () => {
		try {
			await handleConnectWallet();
			setTimeout(() => {
				setWalletAddressDraft(
					useStellarStore.getState().publicKey ||
						wallet?.primaryWalletAddress ||
						'',
				);
				setWalletModalOpen(true);
			}, 0);
		} catch (error: any) {
			if (error?.message === 'SIMPLE_SIGNER_CONNECT_CANCELLED') {
				notificationService.error('Wallet connection was cancelled.');
				return;
			}
			notificationService.error(error?.message || 'Failed to connect wallet.');
		}
	};

	const validateWalletAddress = (walletAddress: string) =>
		/^G[A-Z2-7]{55}$/.test(walletAddress.trim());

	const handleConfirmWalletUpdate = async () => {
		if (!validateWalletAddress(walletAddressDraft)) {
			setWalletFormError('Enter a valid Stellar public wallet address.');
			return;
		}

		try {
			setWalletSaveState('saving');
			const updatedWallet = await developerSettingsService.updateWallet({
				walletAddress: walletAddressDraft.trim(),
				walletLabel: walletLabelDraft.trim(),
			});

			setSummary((current) =>
				current
					? {
							...current,
							wallet: updatedWallet,
					  }
					: current,
			);
			setWalletModalOpen(false);
			setWalletSaveState('idle');
			notificationService.success('Wallet settings updated.');
		} catch (error: any) {
			setWalletSaveState('idle');
			setWalletFormError(
				error?.response?.data?.message || 'Failed to update wallet settings.',
			);
		}
	};

	const handleCopyWalletAddress = async () => {
		if (!wallet?.primaryWalletAddress) return;

		try {
			await navigator.clipboard.writeText(wallet.primaryWalletAddress);
			notificationService.success('Wallet address copied.');
		} catch {
			notificationService.error('Failed to copy wallet address.');
		}
	};

	if (isLoading) {
		return (
			<AppPageShell>
				<AdminPageHeader
					eyebrow="Climate Developer Portal"
					title="Settings"
					description="Loading your developer settings."
				/>
				<div className="rounded-[24px] border border-[#E3E8EF] bg-white p-8 text-sm text-[#5F6C86]">
					Loading settings...
				</div>
			</AppPageShell>
		);
	}

	if (pageError) {
		return (
			<AppPageShell>
				<AdminPageHeader
					eyebrow="Climate Developer Portal"
					title="Settings"
					description="Ongoing company, platform wallet, and entity controls."
				/>
				<div
					className="rounded-[24px] border border-[#F2C7D5] bg-[#FFF7FA] p-8 text-sm text-[#9F335D]"
					data-test="developer-settings-error"
				>
					{pageError}
				</div>
			</AppPageShell>
		);
	}

	return (
		<AppPageShell>
			<AdminPageHeader
				eyebrow="Climate Developer Portal"
				title="Settings"
				description="Manage your legal entity profile, platform wallet records, and SPV linkage without affecting onboarding."
			/>

			<div className="space-y-6">
				<SectionCard
					title="Company Details"
					description="Maintain the legal and operating entity details used across your ongoing platform relationship. Developer Setup remains your onboarding workflow; Settings is your ongoing control surface."
				>
					<div className="grid gap-5 md:grid-cols-2">
						<div>
							<FieldLabel>Legal entity name</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.legalEntityName}
								onChange={onCompanyFieldChange('legalEntityName')}
								data-test="settings-legal-entity-name"
							/>
							{companyErrors.legalEntityName ? (
								<p className="mt-2 text-xs text-[#B42318]">
									{companyErrors.legalEntityName}
								</p>
							) : null}
						</div>
						<div>
							<FieldLabel>Trading name</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.tradingName}
								onChange={onCompanyFieldChange('tradingName')}
								data-test="settings-trading-name"
							/>
						</div>
						<div>
							<FieldLabel>ABN</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.abn}
								onChange={onCompanyFieldChange('abn')}
								data-test="settings-abn"
							/>
						</div>
						<div>
							<FieldLabel>ACN</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.acn}
								onChange={onCompanyFieldChange('acn')}
								data-test="settings-acn"
							/>
						</div>
						<div>
							<FieldLabel>Contact name</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.contactName}
								onChange={onCompanyFieldChange('contactName')}
								data-test="settings-contact-name"
							/>
							{companyErrors.contactName ? (
								<p className="mt-2 text-xs text-[#B42318]">
									{companyErrors.contactName}
								</p>
							) : null}
						</div>
						<div>
							<FieldLabel>Contact email</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.contactEmail}
								onChange={onCompanyFieldChange('contactEmail')}
								data-test="settings-contact-email"
							/>
							{companyErrors.contactEmail ? (
								<p className="mt-2 text-xs text-[#B42318]">
									{companyErrors.contactEmail}
								</p>
							) : null}
						</div>
						<div>
							<FieldLabel>Phone</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.phone}
								onChange={onCompanyFieldChange('phone')}
								data-test="settings-phone"
							/>
						</div>
						<div>
							<FieldLabel>Website</FieldLabel>
							<input
								className={inputClass}
								value={companyForm.website}
								onChange={onCompanyFieldChange('website')}
								data-test="settings-website"
							/>
						</div>
						<div className="md:col-span-2">
							<FieldLabel>Registered address</FieldLabel>
							<textarea
								className={textAreaClass}
								value={companyForm.registeredAddress}
								onChange={onCompanyFieldChange('registeredAddress')}
								data-test="settings-registered-address"
							/>
						</div>
						<div className="md:col-span-2">
							<FieldLabel>Business description</FieldLabel>
							<textarea
								className={textAreaClass}
								value={companyForm.businessDescription}
								onChange={onCompanyFieldChange('businessDescription')}
								data-test="settings-business-description"
							/>
						</div>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-3">
						<ValueCard
							label="Verification status"
							value={summary?.companyDetails.verificationStatus || 'Draft'}
						/>
						<ValueCard
							label="Submitted"
							value={formatTimestamp(summary?.companyDetails.submittedAt)}
						/>
						<ValueCard
							label="Approved"
							value={formatTimestamp(summary?.companyDetails.approvedAt)}
						/>
					</div>

					<div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<p className="text-sm text-[#5F6C86]">
							{companySaveState === 'saved'
								? 'Latest company details saved successfully.'
								: 'Update these details whenever your ongoing operating profile changes.'}
						</p>
						<Button
							type="button"
							dataTest="settings-save-company"
							isLoading={companySaveState === 'saving'}
							onClick={handleSaveCompanyDetails}
							className="bg-[#2F80ED] text-white hover:bg-[#2775E0]"
						>
							Save company details
						</Button>
					</div>
				</SectionCard>

				<SectionCard
					title="Platform Wallet Records"
					description="Review the primary wallet record used for platform operations and issuance support. Platform-managed custody is the default operating model, while legacy wallet details remain visible for continuity."
				>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<ValueCard
							label="Custody model"
							value={
								wallet ? formatCustodyMode(wallet.custodyMode) : 'Not available'
							}
							dataTest="settings-custody-mode"
						/>
						<ValueCard
							label="Primary wallet address"
							value={wallet?.primaryWalletAddress || 'No wallet configured'}
							dataTest="settings-wallet-address"
						/>
						<ValueCard
							label="Wallet status"
							value={wallet?.walletStatus || 'Not available'}
						/>
						<ValueCard
							label="Current session"
							value={
								hasSessionWallet
									? `Connected: ${publicKey}`
									: wallet?.walletConnectionState || 'Disconnected'
							}
						/>
					</div>

					<div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<ValueCard
							label="Wallet label"
							value={wallet?.walletLabel || 'Not provided'}
						/>
						<ValueCard
							label="Last updated"
							value={formatTimestamp(wallet?.lastUpdatedAt)}
						/>
						<ValueCard
							label="Operational review status"
							value={wallet?.custodyChangeStatus || 'none'}
						/>
						<ValueCard
							label="Recorded path"
							value={
								wallet?.requestedCustodyMode
									? formatCustodyMode(wallet.requestedCustodyMode)
									: 'Platform-managed standard'
							}
						/>
					</div>

					<div className="mt-5 rounded-2xl border border-[#F6D7C2] bg-[#FFF8F3] p-4 text-sm leading-6 text-[#805B42]">
						<div>{wallet?.explanatoryCopy.regenxCustody}</div>
						<div>{wallet?.explanatoryCopy.warning}</div>
						{wallet?.hasExistingLiveProjects ? (
							<div data-test="settings-live-project-warning">
								This developer account has {wallet.liveProjectCount} approved,
								issued, or live project
								{wallet.liveProjectCount === 1 ? '' : 's'}. Changes may affect
								future issuance or settlement and will not be applied silently.
							</div>
						) : null}
					</div>

					<div className="mt-6 flex flex-wrap gap-3">
						<Button
							type="button"
							dataTest="settings-connect-wallet"
							onClick={handleConnectWalletClick}
							isLoading={walletConnectLoading}
							className="bg-[#2F80ED] text-white hover:bg-[#2775E0]"
						>
							Connect wallet
						</Button>
						<Button
							type="button"
							dataTest="settings-replace-wallet"
							onClick={openWalletModal}
							className="border border-[#C8D4E3] bg-white text-[#16324F]"
						>
							Replace wallet
						</Button>
						<Button
							type="button"
							dataTest="settings-copy-wallet"
							onClick={handleCopyWalletAddress}
							disabled={!wallet?.primaryWalletAddress}
							className="border border-[#C8D4E3] bg-white text-[#16324F]"
						>
							Copy wallet address
						</Button>
					</div>
				</SectionCard>

				<SectionCard
					title="Entity & SPV Linkage"
					description="Review the operating entity used in offerings and the SPV linkage currently associated with your projects. Where the platform does not yet have linkage data, the interface shows that safely instead of inventing values."
				>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<ValueCard
							label="Primary legal entity"
							value={entityLinkage?.primaryLegalEntity || 'Not yet linked'}
							dataTest="settings-primary-legal-entity"
						/>
						<ValueCard
							label="Operating entity"
							value={entityLinkage?.operatingEntity || 'Not yet linked'}
						/>
						<ValueCard
							label="Linked SPV"
							value={entityLinkage?.linkedSpvName || 'Not yet linked'}
							dataTest="settings-linked-spv-name"
						/>
						<ValueCard
							label="SPV status"
							value={entityLinkage?.linkedSpvStatus || 'Not yet linked'}
							dataTest="settings-linked-spv-status"
						/>
					</div>

					<div className="mt-4">
						<div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
							Related projects
						</div>
						{entityLinkage?.relatedProjects?.length ? (
							<div className="overflow-hidden rounded-2xl border border-[#E5EBF3]">
								<div className="grid grid-cols-1 gap-0 divide-y divide-[#EAEFF5]">
									{entityLinkage.relatedProjects.map((project) => (
										<div
											key={project.projectId}
											className="grid gap-3 bg-white px-4 py-4 md:grid-cols-5"
										>
											<div>
												<div className="text-[11px] uppercase tracking-[0.08em] text-[#71829B]">
													Project
												</div>
												<div className="mt-1 text-sm font-medium text-[#16324F]">
													{project.projectName}
												</div>
											</div>
											<div>
												<div className="text-[11px] uppercase tracking-[0.08em] text-[#71829B]">
													Status
												</div>
												<div className="mt-1 text-sm text-[#16324F]">
													{project.projectStatus}
												</div>
											</div>
											<div>
												<div className="text-[11px] uppercase tracking-[0.08em] text-[#71829B]">
													Entity role
												</div>
												<div className="mt-1 text-sm text-[#16324F]">
													{project.entityRole}
												</div>
											</div>
											<div>
												<div className="text-[11px] uppercase tracking-[0.08em] text-[#71829B]">
													Linked entity
												</div>
												<div className="mt-1 text-sm text-[#16324F]">
													{project.linkedEntityName}
												</div>
											</div>
											<div>
												<div className="text-[11px] uppercase tracking-[0.08em] text-[#71829B]">
													Linked SPV
												</div>
												<div className="mt-1 text-sm text-[#16324F]">
													{String(project.linkedSpvName)} (
													{project.linkedSpvStatus})
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div
								className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FAFCFF] px-4 py-8 text-sm text-[#64748B]"
								data-test="settings-entity-linkage-empty"
							>
								No projects or SPV linkage are currently available for this
								developer account.
							</div>
						)}
					</div>
				</SectionCard>
			</div>

			<BaseModal
				title="Confirm wallet replacement"
				dataTest="settings-wallet-modal"
				isOpen={walletModalOpen}
				closeModal={() => {
					setWalletModalOpen(false);
					setWalletFormError('');
				}}
				submitButton={{
					text: 'Confirm replacement',
					onClick: handleConfirmWalletUpdate,
					isLoading: walletSaveState === 'saving',
				}}
			>
				<div className="space-y-4">
					<p className="text-sm leading-6 text-[#5F6C86]">
						Replacing the primary wallet is a controlled action. Review the
						address carefully before confirming. The backend will reject unsafe
						updates, and issuance or settlement workflows may require additional
						review.
					</p>
					<div>
						<FieldLabel>Wallet address</FieldLabel>
						<input
							className={inputClass}
							value={walletAddressDraft}
							onChange={(event) => {
								setWalletAddressDraft(event.target.value);
								setWalletFormError('');
							}}
							data-test="settings-wallet-modal-address"
						/>
					</div>
					<div>
						<FieldLabel>Wallet label</FieldLabel>
						<input
							className={inputClass}
							value={walletLabelDraft}
							onChange={(event) => setWalletLabelDraft(event.target.value)}
							placeholder="Treasury wallet"
							data-test="settings-wallet-modal-label"
						/>
					</div>
					{walletFormError ? (
						<p
							className="text-sm text-[#B42318]"
							data-test="settings-wallet-modal-error"
						>
							{walletFormError}
						</p>
					) : null}
				</div>
			</BaseModal>
		</AppPageShell>
	);
}
