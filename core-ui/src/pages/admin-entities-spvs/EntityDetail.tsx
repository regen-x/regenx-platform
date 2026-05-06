import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
	entitySpvAdminService,
} from '@/services/entity-spv-admin.service';

export default function EntityDetail() {
	const navigate = useNavigate();
	const { id } = useParams();
	const isNew = !id || id === 'new';
	const [entity, setEntity] = useState<LegalEntityRecord | null>(null);
	const [form, setForm] = useState<EntityFormState>(buildEntityForm(null));
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	useEffect(() => {
		if (isNew || !id) {
			setEntity(null);
			setForm(buildEntityForm(null));
			return;
		}

		const load = async () => {
			try {
				setLoading(true);
				setError('');
				const record = await entitySpvAdminService.getEntityDetail(id);
				setEntity(record);
				setForm(buildEntityForm(record));
			} catch (loadError) {
				console.error('Failed to load legal entity', loadError);
				setError('Failed to load legal entity.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [id, isNew]);

	const title = useMemo(
		() =>
			isNew ? 'Create Legal Entity' : entity?.entityName || 'Legal Entity',
		[entity?.entityName, isNew],
	);

	const handleChange = (field: keyof EntityFormState, value: string) => {
		setForm((current) => ({ ...current, [field]: value }));
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			setError('');
			setSuccess('');
			const payload = {
				...form,
				custodyModel: form.custodyModel || undefined,
			};
			const saved = isNew
				? await entitySpvAdminService.createEntity(payload)
				: await entitySpvAdminService.updateEntity(String(id), payload);
			setEntity(saved);
			setForm(buildEntityForm(saved));
			setSuccess(
				isNew
					? 'Legal entity created successfully.'
					: 'Legal entity updated successfully.',
			);
			if (isNew) {
				navigate(`/admin/entities-spvs/entities/${saved.id}`, {
					replace: true,
				});
			}
		} catch (saveError: any) {
			console.error('Failed to save legal entity', saveError);
			setError(
				saveError?.response?.data?.message ||
					saveError?.message ||
					'Failed to save legal entity.',
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#F7F8FB] px-4 py-4">
			<div className="max-w-[1220px]">
				<AdminPageHeader
					eyebrow="Admin Portal"
					title={title}
					description="Manage the legal entity details that projects and SPVs depend on for issuance, custody, and operational linkage."
				/>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
					<AdminSectionCard className="space-y-4">
						{error ? (
							<div className="rounded-[16px] border border-[#F3D2D2] bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#B42318]">
								{error}
							</div>
						) : null}
						{success ? (
							<div className="rounded-[16px] border border-[#B7E4C7] bg-[#F4FFF7] px-4 py-3 text-[13px] text-[#236A43]">
								{success}
							</div>
						) : null}
						<EntityFormFields form={form} onChange={handleChange} />

						<div className="flex flex-wrap gap-3">
							<AdminActionButton
								tone="primary"
								disabled={saving || loading}
								onClick={handleSave}
							>
								{saving
									? 'Saving...'
									: isNew
									? 'Create Entity'
									: 'Save Changes'}
							</AdminActionButton>
							<AdminActionButton
								tone="secondary"
								onClick={() => navigate('/admin/entities-spvs')}
							>
								Back to Registry
							</AdminActionButton>
						</div>
					</AdminSectionCard>

					<AdminSectionCard className="space-y-4">
						<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
							Entity Status
						</div>
						<AdminStatusBadge label={form.status} tone="blue" />
						<p className="text-[13px] leading-[1.6] text-[#5F6C86]">
							Entity records become available for project and SPV linkage as
							soon as they are saved. Use status to reflect whether the legal
							structure is active in production.
						</p>
					</AdminSectionCard>
				</div>
			</div>
		</div>
	);
}
