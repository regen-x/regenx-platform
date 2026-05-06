import BaseModal from '../base-modal';

import CreateProjectForm from '@/components/form/create-project-form';

type DSEType = 'ODSE' | 'DDSE' | 'HDSE';

interface ICreateProjectModalProps {
	isOpen: boolean;
	onSubmit: (createProjectFields: any) => Promise<void>;
	closeModal: () => void;
	initialValues?: {
		name?: string;
		fundingGoal?: number | string;
		dseType?: DSEType;
	};
	title?: string;
	submitLabel?: string;
}

const CreateProjectModal = ({
	isOpen,
	onSubmit,
	closeModal,
	initialValues,
	title = 'Create climate project',
	submitLabel = 'Create Project & Continue',
}: ICreateProjectModalProps) => {
	return (
		<BaseModal
			title={title}
			showFooter={false}
			isOpen={isOpen}
			closeModal={closeModal}
			dataTest="create-project-modal"
		>
			<CreateProjectForm
				handleSubmit={onSubmit}
				doubleColumn
				initialValues={initialValues}
				submitLabel={submitLabel}
			/>
		</BaseModal>
	);
};

export default CreateProjectModal;
