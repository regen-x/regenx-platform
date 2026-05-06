import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
	AdminActionButton,
	AdminPageHeader,
	AdminSectionCard,
	AdminStatusBadge,
} from '@/components/admin-ui';
import {
	EntityFormFields,
	EntityFormState,
	buildEntityForm,
} from '@/pages/admin-entities-spvs/EntityFormFields';
import {
	LegalEntityRecord,
	SpvLinkedPartyRecord,
	SpvRecord,
	entitySpvAdminService,
} from '@/services/entity-spv-admin.service';

type SpvFormState = {
	name: string;
	legalEntityName: string;
	jurisdiction: string;
	structureType: string;
	status: SpvRecord['status'];
	notes: string;
	sponsorEntityId: string;
	custodyModel: '' | 'self_custody' | 'regenx_custody';
	projectId: string;
	reason: string;
};

const buildSpvForm = (spv?: SpvRecord | null): SpvFormState => ({
	name: spv?.name ?? '',
	legalEntityName: spv?.legalEntityName ?? '',
	jurisdiction: spv?.jurisdiction ?? '',
	structureType: spv?.structureType ?? '',
	status: spv?.status ?? 'draft',
	notes: spv?.notes ?? '',
	sponsorEntityId: spv?.sponsorEntityId ? String(spv.sponsorEntityId) : '',
	custodyModel: spv?.custodyModel ?? '',
	projectId: spv?.projectId ? String(spv.projectId) : '',
	reason: '',
});

const getTone = (
	status?: string | null,
): 'yellow' | 'pink' | 'blue' | 'gray' => {
	switch (status) {
		case 'ready':
		case 'approved':
		case 'active':
			return 'blue';
		case 'blocked':
		case 'rejected':
		case 'archived':
			return 'pink';
		case 'missing':
		case 'draft':
		case 'suggested':
		case 'inactive':
			return 'yellow';
		default:
			return 'gray';
	}
};

function ReadinessFlag({ label, value }: { label: string; value: boolean }) {
	return (
		<SidebarField
			label={label}
			value={
				<AdminStatusBadge
					label={value ? 'Yes' : 'No'}
					tone={value ? 'blue' : 'yellow'}
				/>
			}
		/>
	);
}

function SidebarField({
	label,
	value,
}: {
	label: string;
	value?: React.ReactNode;
}) {
	return (
		<div className="rounded-[14px] border border-[#E7ECF4] bg-[#F8FAFC] px-4 py-3">
			<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A96AA]">
				{label}
			</div>
			<div className="mt-2 break-words text-[15px] font-semibold leading-[1.4] text-[#101828]">
				{value === undefined || value === null || value === '' ? '—' : value}
			</div>
		</div>
	);
}

export default function SpvDetail() {
	const location = useLocation();
	const navigate = useNavigate();
	const { id } = useParams();
	const isNew = !id || id === 'new';
	const [spv, setSpv] = useState<SpvRecord | null>(null);
	const [entities, setEntities] = useState<LegalEntityRecord[]>([]);
	const [form, setForm] = useState<SpvFormState>(buildSpvForm(null));
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [roleBusyKey, setRoleBusyKey] = useState<string | null>(null);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(
		(location.state as { flashSuccess?: string } | null)?.flashSuccess ?? '',
	);
	const [selectedEntityByRole, setSelectedEntityByRole] = useState<
		Record<string, string>
	>({});
	const [createAndLinkRole, setCreateAndLinkRole] =
		useState<SpvLinkedPartyRecord | null>(null);
	const [inlineEntityForm, setInlineEntityForm] = useState<EntityFormState>(
		buildEntityForm(null),
	);

	const load = async () => {
		try {
			setLoading(true);
			setError('');
			const [entityRows, spvRecord] = await Promise.all([
				entitySpvAdminService.listEntities(),
				isNew || !id
					? Promise.resolve(null)
					: entitySpvAdminService.getSpvDetail(id),
			]);
			setEntities(entityRows ?? []);
			setSpv(spvRecord);
			setForm(buildSpvForm(spvRecord));
			setSelectedEntityByRole(
				Object.fromEntries(
					(spvRecord?.linkedParties ?? []).map((party) => [
						party.key,
						party.entityId ? String(party.entityId) : '',
					]),
				),
			);
		} catch (loadError) {
			console.error('Failed to load SPV detail', loadError);
			setError('Failed to load SPV detail.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void load();
	}, [id, isNew]);

	const entityOptions = useMemo(
		() =>
			entities.map((entity) => ({
				value: String(entity.id),
				label: entity.entityName,
			})),
		[entities],
	);

	const handleSpvChange = (field: keyof SpvFormState, value: string) => {
		setForm((current) => ({ ...current, [field]: value }));
	};

	const handleEntityChange = (field: keyof EntityFormState, value: string) => {
		setInlineEntityForm((current) => ({ ...current, [field]: value }));
	};

	const handleSaveSpv = async () => {
		try {
			setSaving(true);
			setError('');
			setSuccess('');
			const payload = {
				name: form.name,
				legalEntityName: form.legalEntityName,
				jurisdiction: form.jurisdiction,
				structureType: form.structureType,
				status: form.status,
				notes: form.notes,
				sponsorEntityId: form.sponsorEntityId
					? Number(form.sponsorEntityId)
					: undefined,
				custodyModel: form.custodyModel || undefined,
				projectId: form.projectId ? Number(form.projectId) : undefined,
				reason: form.reason,
			};
			const saved = isNew
				? await entitySpvAdminService.createSpv(payload)
				: await entitySpvAdminService.updateSpv(String(id), payload);
			setSpv(saved);
			setForm(buildSpvForm(saved));
			setSuccess(
				isNew ? 'SPV created successfully.' : 'SPV updated successfully.',
			);
			if (isNew) {
				navigate(`/admin/entities-spvs/spvs/${saved.id}`, { replace: true });
			}
		} catch (saveError: any) {
			console.error('Failed to save SPV', saveError);
			setError(
				saveError?.response?.data?.message ||
					saveError?.message ||
					'Failed to save SPV.',
			);
		} finally {
			setSaving(false);
		}
	};

	const updateSpvRecord = (record: SpvRecord, message: string) => {
		setSpv(record);
		setForm(buildSpvForm(record));
		setSelectedEntityByRole(
			Object.fromEntries(
				(record.linkedParties ?? []).map((party) => [
					party.key,
					party.entityId ? String(party.entityId) : '',
				]),
			),
		);
		setSuccess(message);
	};

	const handleRoleMutation = async (
		role: SpvLinkedPartyRecord,
		action: 'approve' | 'replace' | 'manual',
	) => {
		if (!spv) return;
		const selectedEntityId =
			selectedEntityByRole[role.key] ||
			(role.entityId ? String(role.entityId) : '');
		if (!selectedEntityId) {
			setError('Choose an entity before saving the linked party action.');
			return;
		}

		try {
			setRoleBusyKey(`${role.key}-${action}`);
			setError('');
			setSuccess('');
			const saved = await entitySpvAdminService.upsertSpvRole(spv.id, {
				role: role.role,
				entityId: Number(selectedEntityId),
				status: 'approved',
				source: 'manual',
				isRequired: role.isRequired,
				reason:
					action === 'approve'
						? `Approve ${role.label}`
						: action === 'replace'
						? `Replace ${role.label}`
						: `Add manual ${role.label} link`,
			});
			updateSpvRecord(
				saved,
				action === 'approve'
					? `${role.label} approved.`
					: action === 'replace'
					? `${role.label} replaced.`
					: `${role.label} linked manually.`,
			);
		} catch (mutationError: any) {
			console.error('Failed linked-party action', mutationError);
			setError(
				mutationError?.response?.data?.message ||
					mutationError?.message ||
					'Failed to update linked party.',
			);
		} finally {
			setRoleBusyKey(null);
		}
	};

	const handleReject = async (role: SpvLinkedPartyRecord) => {
		if (!spv || !role.roleLinkId) return;
		try {
			setRoleBusyKey(`${role.key}-reject`);
			setError('');
			setSuccess('');
			const saved = await entitySpvAdminService.rejectSpvRole(
				spv.id,
				role.roleLinkId,
				`Reject ${role.label} suggestion`,
			);
			updateSpvRecord(saved, `${role.label} suggestion rejected.`);
		} catch (rejectError: any) {
			console.error('Failed to reject linked party', rejectError);
			setError(
				rejectError?.response?.data?.message ||
					rejectError?.message ||
					'Failed to reject linked party.',
			);
		} finally {
			setRoleBusyKey(null);
		}
	};

	const handleCreateAndLink = async () => {
		if (!spv || !createAndLinkRole) return;
		try {
			setRoleBusyKey(`${createAndLinkRole.key}-create`);
			setError('');
			setSuccess('');
			const entity = await entitySpvAdminService.createEntity({
				...inlineEntityForm,
				custodyModel: inlineEntityForm.custodyModel || undefined,
			});
			const saved = await entitySpvAdminService.upsertSpvRole(spv.id, {
				role: createAndLinkRole.role,
				entityId: entity.id,
				status: 'approved',
				source: 'manual',
				isRequired: createAndLinkRole.isRequired,
				reason:
					inlineEntityForm.reason ||
					`Create and link entity for ${createAndLinkRole.label}`,
			});
			setEntities((current) => [entity, ...current]);
			setCreateAndLinkRole(null);
			setInlineEntityForm(buildEntityForm(null));
			updateSpvRecord(saved, `${entity.entityName} created and linked.`);
		} catch (createError: any) {
			console.error('Failed to create and link entity', createError);
			setError(
				createError?.response?.data?.message ||
					createError?.message ||
					'Failed to create and link entity.',
			);
		} finally {
			setRoleBusyKey(null);
		}
	};

	return (
		<div className="bg-[#F7F8FB] px-4 py-4" data-cy="spv-detail-page">
			<div className="mx-auto max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title={isNew ? 'Create SPV' : spv?.name || 'SPV Detail'}
					description="Review suggested linked parties, replace or reject weak matches, create missing entities inline, and follow backend readiness truth before issuance."
				/>

				<div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
					<main className="min-w-0 space-y-6">
						<AdminSectionCard className="min-w-0 space-y-4">
							{error ? (
								<div
									className="rounded-[16px] border border-[#F3D2D2] bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#B42318]"
									data-cy="spv-detail-error"
								>
									{error}
								</div>
							) : null}
							{success ? (
								<div
									className="rounded-[16px] border border-[#B7E4C7] bg-[#F4FFF7] px-4 py-3 text-[13px] text-[#236A43]"
									data-cy="spv-detail-success"
								>
									{success}
								</div>
							) : null}

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{[
									['SPV Name', 'name'],
									['Legal Entity Name', 'legalEntityName'],
									['Jurisdiction', 'jurisdiction'],
									['Structure Type', 'structureType'],
									['Linked Project Id', 'projectId'],
								].map(([label, key]) => (
									<label
										key={key}
										className="text-sm font-medium text-[#344054]"
									>
										{label}
										<input
											value={form[key as keyof SpvFormState] as string}
											onChange={(event) =>
												handleSpvChange(
													key as keyof SpvFormState,
													event.target.value,
												)
											}
											className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
										/>
									</label>
								))}
								<label className="text-sm font-medium text-[#344054]">
									Status
									<select
										value={form.status}
										onChange={(event) =>
											handleSpvChange('status', event.target.value)
										}
										className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
									>
										<option value="draft">Draft</option>
										<option
											value="ready"
											disabled={
												!spv?.readiness?.issuanceReady &&
												form.status !== 'ready'
											}
										>
											Ready
										</option>
										<option value="active">Active</option>
										<option value="inactive">Inactive</option>
										<option value="archived">Archived</option>
									</select>
								</label>
								<label className="text-sm font-medium text-[#344054]">
									Sponsor Entity
									<select
										value={form.sponsorEntityId}
										onChange={(event) =>
											handleSpvChange('sponsorEntityId', event.target.value)
										}
										className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
									>
										<option value="">Not linked</option>
										{entityOptions.map((entity) => (
											<option key={entity.value} value={entity.value}>
												{entity.label}
											</option>
										))}
									</select>
								</label>
								<label className="text-sm font-medium text-[#344054]">
									Custody Readiness Path
									<select
										value={form.custodyModel}
										onChange={(event) =>
											handleSpvChange('custodyModel', event.target.value)
										}
										className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
									>
										<option value="">Not set</option>
										<option value="regenx_custody">RegenX custody</option>
										{form.custodyModel === 'self_custody' ? (
											<option value="self_custody" disabled>
												Legacy self-custody record
											</option>
										) : null}
									</select>
									<p className="mt-2 text-xs leading-5 text-[#667085]">
										Use platform-managed custody for standard issuance
										readiness. Legacy self-custody values remain visible for
										historical context only.
									</p>
								</label>
								<label className="text-sm font-medium text-[#344054] md:col-span-2">
									Notes
									<textarea
										value={form.notes}
										onChange={(event) =>
											handleSpvChange('notes', event.target.value)
										}
										rows={4}
										className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
									/>
								</label>
								<label className="text-sm font-medium text-[#344054] md:col-span-2">
									Reason for Change
									<textarea
										value={form.reason}
										onChange={(event) =>
											handleSpvChange('reason', event.target.value)
										}
										rows={3}
										className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
									/>
								</label>
							</div>

							<div className="flex flex-wrap gap-3">
								<AdminActionButton
									tone="primary"
									disabled={saving || loading}
									onClick={() => void handleSaveSpv()}
									data-cy="save-spv-button"
								>
									{saving ? 'Saving...' : isNew ? 'Create SPV' : 'Save Changes'}
								</AdminActionButton>
								<AdminActionButton
									tone="secondary"
									onClick={() => navigate('/admin/entities-spvs')}
								>
									Back to Registry
								</AdminActionButton>
							</div>
						</AdminSectionCard>

						{!isNew && spv ? (
							<AdminSectionCard className="min-w-0 space-y-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
											Linked Parties
										</div>
										<p className="mt-2 text-[13px] leading-[1.6] text-[#5F6C86]">
											Approve suggested links, replace them, reject them, or
											create missing entities inline without leaving this SPV.
										</p>
									</div>
									<AdminStatusBadge
										label={
											spv.readiness.issuanceReady ? 'Ready' : 'Needs Review'
										}
										tone={spv.readiness.issuanceReady ? 'blue' : 'yellow'}
									/>
								</div>

								<div className="space-y-4" data-cy="linked-parties-section">
									{spv.linkedParties.map((party) => {
										const selectedEntityId =
											selectedEntityByRole[party.key] ||
											(party.entityId ? String(party.entityId) : '');
										const busy = Boolean(roleBusyKey?.startsWith(party.key));

										return (
											<div
												key={party.key}
												className="rounded-[18px] border border-[#E7ECF4] bg-[#F8FAFC] p-4"
												data-cy={`linked-party-row-${party.key}`}
											>
												<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
													<div>
														<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
															{party.label}
														</div>
														<div className="mt-2 text-[18px] font-semibold text-[#163F74]">
															{party.entityName || 'Not linked'}
														</div>
														<div className="mt-1 text-[13px] text-[#5F6C86]">
															Role: {party.role.replaceAll('_', ' ')} • Source:{' '}
															{party.source || 'n/a'}
														</div>
													</div>
													<div className="flex flex-wrap gap-2">
														<AdminStatusBadge
															label={party.status}
															tone={getTone(party.status)}
														/>
														<AdminStatusBadge
															label={party.isRequired ? 'Required' : 'Optional'}
															tone={party.isRequired ? 'blue' : 'gray'}
														/>
													</div>
												</div>

												<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
													<select
														value={selectedEntityId}
														onChange={(event) =>
															setSelectedEntityByRole((current) => ({
																...current,
																[party.key]: event.target.value,
															}))
														}
														className="rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
														data-cy={`linked-party-select-${party.key}`}
													>
														<option value="">Choose entity</option>
														{entityOptions.map((entity) => (
															<option
																key={`${party.key}-${entity.value}`}
																value={entity.value}
															>
																{entity.label}
															</option>
														))}
													</select>
													<div className="flex flex-wrap gap-2">
														<AdminActionButton
															tone="primary"
															disabled={busy}
															onClick={() =>
																void handleRoleMutation(party, 'approve')
															}
															data-cy={`approve-party-${party.key}`}
														>
															Approve
														</AdminActionButton>
														<AdminActionButton
															tone="secondary"
															disabled={busy}
															onClick={() =>
																void handleRoleMutation(
																	party,
																	party.entityId ? 'replace' : 'manual',
																)
															}
															data-cy={`replace-party-${party.key}`}
														>
															{party.entityId ? 'Replace' : 'Add Manual Link'}
														</AdminActionButton>
														<AdminActionButton
															tone="secondary"
															disabled={busy}
															onClick={() => {
																setCreateAndLinkRole(party);
																setInlineEntityForm(
																	buildEntityForm(null, party.role),
																);
															}}
															data-cy={`create-link-party-${party.key}`}
														>
															Create and Link Entity
														</AdminActionButton>
														{party.roleLinkId ? (
															<AdminActionButton
																tone="danger"
																disabled={busy}
																onClick={() => void handleReject(party)}
																data-cy={`reject-party-${party.key}`}
															>
																Reject
															</AdminActionButton>
														) : null}
													</div>
												</div>

												{party.notes ? (
													<div className="mt-3 rounded-[14px] border border-[#E7ECF4] bg-white px-4 py-3 text-[13px] text-[#5F6C86]">
														{party.notes}
													</div>
												) : null}
											</div>
										);
									})}
								</div>
							</AdminSectionCard>
						) : null}
					</main>

					<aside className="space-y-4 self-start xl:sticky xl:top-4">
						<AdminSectionCard
							className="space-y-4 p-4"
							data-cy="spv-readiness-panel"
						>
							<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
								SPV Readiness
							</div>
							<ReadinessFlag
								label="Required Roles Complete"
								value={Boolean(spv?.readiness?.requiredRolesComplete)}
							/>
							<ReadinessFlag
								label="Custody Complete"
								value={Boolean(spv?.readiness?.custodyComplete)}
							/>
							<ReadinessFlag
								label="Issuance Ready"
								value={Boolean(spv?.readiness?.issuanceReady)}
							/>
							<SidebarField
								label="Linked Project"
								value={spv?.linkedProjectName || 'Manual / unlinked'}
							/>
						</AdminSectionCard>

						<AdminSectionCard className="space-y-4 p-4">
							<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
								Blocking Issues
							</div>
							<div className="space-y-2 text-sm text-[#5F6C86]">
								{spv?.readiness?.blockingIssues?.length ? (
									spv.readiness.blockingIssues.map((issue, index) => (
										<div
											key={`${issue}-${index}`}
											className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
											data-cy={`readiness-issue-${index}`}
										>
											{issue}
										</div>
									))
								) : (
									<div className="rounded-[14px] border border-[#D8E8DB] bg-[#F5FFF7] px-4 py-3 text-[13px] text-[#236A43]">
										No blocking issues.
									</div>
								)}
							</div>
						</AdminSectionCard>

						{!isNew && spv ? (
							<AdminSectionCard className="space-y-4 p-4">
								<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
									Linked Party Summary
								</div>
								<div className="grid grid-cols-1 gap-3">
									<SidebarField
										label="Approved Links"
										value={String(spv.roleCoverage.approved)}
									/>
									<SidebarField
										label="Suggested Links"
										value={String(spv.roleCoverage.suggested)}
									/>
									<SidebarField
										label="Missing Roles"
										value={String(spv.roleCoverage.missing)}
									/>
								</div>
								<p className="text-[13px] leading-[1.6] text-[#5F6C86]">
									Readiness is backend-driven. If a role is required, it is not
									complete until the backend marks it approved and custody
									blockers are cleared.
								</p>
							</AdminSectionCard>
						) : null}
					</aside>
				</div>

				{createAndLinkRole ? (
					<div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4">
						<div
							className="w-full max-w-[760px] rounded-[24px] border border-[#E7ECF4] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
							data-cy="create-link-entity-modal"
						>
							<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
								Create and Link Entity
							</div>
							<h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-[#163F74]">
								{createAndLinkRole.label}
							</h2>
							<p className="mt-2 text-[13px] leading-[1.6] text-[#5F6C86]">
								Create a legal entity inline and link it to this SPV role in one
								step.
							</p>
							<div className="mt-5">
								<EntityFormFields
									form={inlineEntityForm}
									onChange={handleEntityChange}
									testIdPrefix="create-link-entity"
								/>
							</div>
							<div className="mt-6 flex flex-wrap gap-3">
								<AdminActionButton
									tone="primary"
									disabled={Boolean(roleBusyKey)}
									onClick={() => void handleCreateAndLink()}
									data-cy="save-create-link-entity"
								>
									{roleBusyKey ? 'Saving...' : 'Save Entity and Link'}
								</AdminActionButton>
								<AdminActionButton
									tone="secondary"
									disabled={Boolean(roleBusyKey)}
									onClick={() => setCreateAndLinkRole(null)}
								>
									Cancel
								</AdminActionButton>
							</div>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
