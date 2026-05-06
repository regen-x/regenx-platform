import { IGenericInput } from '@/components/form/input/generic-input';
import { IEditOfferPrice } from '@/interfaces/services/IOfferService';

export const editOfferPriceInitialValues: IEditOfferPrice = {
	price: 0,
};

export const editOfferPriceFormGenericFields: IGenericInput[] = [
	{
		name: 'price',
		label: 'Price',
		type: 'number',
		placeholder: 'Enter price',
		['data-test']: 'edit-offer-price',
	},
];
