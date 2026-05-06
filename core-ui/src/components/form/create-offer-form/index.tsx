import { Form, Formik } from 'formik';
import { twMerge } from 'tailwind-merge';

import FormFields from '../fields';
import SelectInput from '../input/select-input';

import Button from '@/components/common/button';
import {
	createOfferFormGenericFields,
	createOfferInitialValues,
} from '@/constants/form/create-offer';
import { createOfferSchema } from '@/constants/schemas/create-offer.schema';
import { ICreateOffer } from '@/interfaces/services/IOfferService';

interface ICreateOfferFormProps {
	doubleColumn?: boolean;
	handleSubmit: (createOfferFields: ICreateOffer) => Promise<void>;
	options: { label: string; value: string | undefined }[];
}

const CreateOfferForm = ({
	doubleColumn,
	handleSubmit,
	options,
}: ICreateOfferFormProps) => {
	return (
		<Formik
			initialValues={createOfferInitialValues}
			validationSchema={createOfferSchema}
			onSubmit={(createOfferFields) => handleSubmit(createOfferFields)}
		>
			{({ isSubmitting }) => (
				<Form
					className={twMerge(
						'flex flex-col gap-y-1',
						doubleColumn && 'flex-wrap max-h-[30rem] max-w-[25rem] gap-x-10',
					)}
				>
					<FormFields fields={createOfferFormGenericFields} />
					<SelectInput
						name="projectUuid"
						label="Project"
						options={options}
						data-test="create-offer-project"
					/>

					<Button
						type="submit"
						dataTest="create-offer-submit"
						isLoading={isSubmitting}
						disabled={isSubmitting}
					>
						Create Offer
					</Button>
				</Form>
			)}
		</Formik>
	);
};

export default CreateOfferForm;
