import { LegalEntityRecord } from '@/services/entity-spv-admin.service';

export type EntityFormState = {
	entityName: string;
	tradingName: string;
	entityType: string;
	abn: string;
	acn: string;
	jurisdiction: string;
	status: LegalEntityRecord['status'];
	contactEmail: string;
	notes: string;
	operationalRole: string;
	custodyModel: '' | 'self_custody' | 'regenx_custody';
	reason: string;
};

export const buildEntityForm = (
	entity?: Partial<LegalEntityRecord> | null,
	role?: string,
): EntityFormState => ({
	entityName: entity?.entityName ?? '',
	tradingName: entity?.tradingName ?? '',
	entityType: entity?.entityType ?? '',
	abn: entity?.abn ?? '',
	acn: entity?.acn ?? '',
	jurisdiction: entity?.jurisdiction ?? '',
	status: entity?.status ?? 'draft',
	contactEmail: entity?.contactEmail ?? '',
	notes: entity?.notes ?? '',
	operationalRole: entity?.operationalRole ?? role ?? '',
	custodyModel: entity?.custodyModel ?? '',
	reason: '',
});

export function EntityFormFields({
	form,
	onChange,
	includeReason = true,
	testIdPrefix,
}: {
	form: EntityFormState;
	onChange: (field: keyof EntityFormState, value: string) => void;
	includeReason?: boolean;
	testIdPrefix?: string;
}) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{[
				['Entity Name', 'entityName'],
				['Trading Name', 'tradingName'],
				['Entity Type', 'entityType'],
				['ABN', 'abn'],
				['ACN', 'acn'],
				['Jurisdiction', 'jurisdiction'],
				['Contact Email', 'contactEmail'],
				['Operational Role', 'operationalRole'],
			].map(([label, key]) => (
				<label key={key} className="text-sm font-medium text-[#344054]">
					{label}
					<input
						value={form[key as keyof EntityFormState] as string}
						onChange={(event) =>
							onChange(key as keyof EntityFormState, event.target.value)
						}
						data-cy={
							testIdPrefix ? `${testIdPrefix}-${String(key)}` : undefined
						}
						className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
					/>
				</label>
			))}
			<label className="text-sm font-medium text-[#344054]">
				Status
				<select
					value={form.status}
					onChange={(event) => onChange('status', event.target.value)}
					data-cy={testIdPrefix ? `${testIdPrefix}-status` : undefined}
					className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
				>
					<option value="draft">Draft</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
					<option value="archived">Archived</option>
				</select>
			</label>
			<label className="text-sm font-medium text-[#344054]">
				Custody Readiness Path
				<select
					value={form.custodyModel}
					onChange={(event) => onChange('custodyModel', event.target.value)}
					data-cy={testIdPrefix ? `${testIdPrefix}-custodyModel` : undefined}
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
					Platform-managed custody is the standard operating path. Legacy
					self-custody records remain visible for reference only.
				</p>
			</label>
			<label className="text-sm font-medium text-[#344054] md:col-span-2">
				Notes
				<textarea
					value={form.notes}
					onChange={(event) => onChange('notes', event.target.value)}
					rows={4}
					data-cy={testIdPrefix ? `${testIdPrefix}-notes` : undefined}
					className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
				/>
			</label>
			{includeReason ? (
				<label className="text-sm font-medium text-[#344054] md:col-span-2">
					Reason for Change
					<textarea
						value={form.reason}
						onChange={(event) => onChange('reason', event.target.value)}
						rows={3}
						data-cy={testIdPrefix ? `${testIdPrefix}-reason` : undefined}
						className="mt-2 w-full rounded-[16px] border border-[#D7DFEA] bg-white px-4 py-3 text-sm text-[#101828] outline-none focus:border-[#2F80ED]"
						placeholder="Capture why this entity record is being created or updated."
					/>
				</label>
			) : null}
		</div>
	);
}
