import { useEffect, useState } from 'react';

import Button from '@/components/common/button';
import DSESelector from '@/components/form/dse-selector';

type DSEType = 'ODSE' | 'DDSE' | 'HDSE';

interface ICreateProjectFormProps {
	handleSubmit: (createProjectFields: any) => void | Promise<void>;
	doubleColumn?: boolean;
	initialValues?: {
		name?: string;
		fundingGoal?: number | string;
		dseType?: DSEType;
	};
	submitLabel?: string;
}

const CreateProjectForm: React.FC<ICreateProjectFormProps> = ({
	handleSubmit,
	doubleColumn = false,
	initialValues,
	submitLabel = 'Create Project & Continue',
}) => {
	const [name, setName] = useState('');
	const [fundingGoal, setFundingGoal] = useState('');
	const [dseType, setDseType] = useState<DSEType>();
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setName(initialValues?.name ?? '');
		setFundingGoal(
			initialValues?.fundingGoal !== undefined
				? String(initialValues.fundingGoal)
				: '',
		);
		setDseType(initialValues?.dseType);
	}, [initialValues]);

	const onSubmit = async () => {
		if (!name.trim()) {
			alert('Project name required');
			return;
		}

		if (!dseType) {
			alert('Please select a project structure');
			return;
		}

		try {
			setIsSubmitting(true);

			await handleSubmit({
				name: name.trim(),
				fundingGoal: fundingGoal ? Number(fundingGoal) : 0,
				dseType,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className={`grid gap-6 ${
				doubleColumn ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
			}`}
		>
			<div className="flex flex-col gap-2">
				<label className="text-sm font-semibold text-slate-700">
					Project Name
				</label>
				<input
					className="w-full rounded-lg border border-slate-300 px-3 py-2"
					value={name}
					onChange={(e) => setName(e.target.value)}
					data-test="create-project-name-input"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label className="text-sm font-semibold text-slate-700">
					Funding Goal
				</label>
				<input
					type="number"
					className="w-full rounded-lg border border-slate-300 px-3 py-2"
					value={fundingGoal}
					onChange={(e) => setFundingGoal(e.target.value)}
					data-test="create-project-funding-goal-input"
				/>
			</div>

			<div className={doubleColumn ? 'md:col-span-2' : ''}>
				<DSESelector value={dseType} onChange={setDseType} />
			</div>

			<div className={doubleColumn ? 'md:col-span-2' : ''}>
				<Button
					type="button"
					onClick={onSubmit}
					dataTest="create-project-submit-button"
					className="w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Saving...' : submitLabel}
				</Button>
			</div>
		</div>
	);
};

export default CreateProjectForm;
