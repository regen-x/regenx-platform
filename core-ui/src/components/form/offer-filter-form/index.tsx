import { Form, Formik } from 'formik';
import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { useDebouncedCallback } from 'use-debounce';

import FormFields from '../fields';

import {
	offerFilterFormGenericFields,
	offerFilterInitialValues,
} from '@/constants/form/offer-filter';
import { offerFilterSchema } from '@/constants/schemas/offer-filter.schema';
import { IOfferFilterOptions } from '@/interfaces/api/IOffer';

interface ICreateProjectFormProps {
	doubleColumn?: boolean;
	handleSubmit: (offerFilterFields: IOfferFilterOptions) => Promise<void>;
}

const OfferFilterFormController = ({
	filterOptionsValues,
	doubleColumn,
	handleSubmit,
}: {
	filterOptionsValues: IOfferFilterOptions;
	doubleColumn?: boolean;
	handleSubmit: (offerFilterFields: IOfferFilterOptions) => Promise<void>;
}) => {
	const MILLISECONDS_TO_DEBOUNCE = 1000;
	const handleDebouncedFilter = useDebouncedCallback(
		(filterValues: IOfferFilterOptions) => {
			handleSubmit(filterValues);
		},
		MILLISECONDS_TO_DEBOUNCE,
	);

	useEffect(() => {
		handleDebouncedFilter(filterOptionsValues);
	}, [filterOptionsValues, handleDebouncedFilter]);

	return (
		<Form
			className={twMerge(
				'flex flex-col gap-y-1',
				doubleColumn && 'flex-wrap max-h-[30rem] max-w-[25rem] gap-x-10',
			)}
		>
			<FormFields fields={offerFilterFormGenericFields} />
		</Form>
	);
};

const OfferFilterForm = ({
	doubleColumn,
	handleSubmit,
}: ICreateProjectFormProps) => {
	return (
		<Formik
			initialValues={offerFilterInitialValues}
			validationSchema={offerFilterSchema}
			onSubmit={(offerFilterFields) => handleSubmit(offerFilterFields)}
		>
			{({ values }) => {
				return (
					<OfferFilterFormController
						filterOptionsValues={values}
						doubleColumn={doubleColumn}
						handleSubmit={handleSubmit}
					/>
				);
			}}
		</Formik>
	);
};

export default OfferFilterForm;
