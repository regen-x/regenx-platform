import { Form, Formik } from 'formik';
import { twMerge } from 'tailwind-merge';

import FormFields from '../fields';

import Button from '@/components/common/button';
import {
	editOfferPriceFormGenericFields,
	editOfferPriceInitialValues,
} from '@/constants/form/edit-offer-price';
import { editOfferPriceSchema } from '@/constants/schemas/edit-offer.schema';
import { IEditOfferPrice } from '@/interfaces/services/IOfferService';

interface IEditOfferPriceFormProps {
	doubleColumn?: boolean;
	handleSubmit: (editOfferPriceFields: IEditOfferPrice) => Promise<void>;
}

const EditOfferPriceForm = ({
	doubleColumn,
	handleSubmit,
}: IEditOfferPriceFormProps) => {
	return (
		<Formik
			initialValues={editOfferPriceInitialValues}
			validationSchema={editOfferPriceSchema}
			onSubmit={(editOfferPriceFields) => handleSubmit(editOfferPriceFields)}
		>
			{({ isSubmitting }) => (
				<Form
					className={twMerge(
						'flex flex-col gap-y-1',
						doubleColumn && 'flex-wrap max-h-[30rem] max-w-[25rem] gap-x-10',
					)}
				>
					<FormFields fields={editOfferPriceFormGenericFields} />

					<Button
						type="submit"
						dataTest="edit-offer-price-submit"
						isLoading={isSubmitting}
						disabled={isSubmitting}
					>
						Update Price
					</Button>
				</Form>
			)}
		</Formik>
	);
};

export default EditOfferPriceForm;
