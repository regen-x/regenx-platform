import { IGenericInput } from '@/components/form/input/generic-input';
import { ICreateOffer } from '@/interfaces/services/IOfferService';

export const createOfferInitialValues: ICreateOffer = {
	price: 0,
	amount: 0,
	projectUuid: '',
	userAddress: '',
};

export const createOfferFormGenericFields: IGenericInput[] = [
	{
		name: 'price',
		label: 'Price',
		type: 'number',
		placeholder: 'Enter price',
		['data-test']: 'create-offer-price',
	},
	{
		name: 'amount',
		label: 'Amount',
		type: 'number',
		placeholder: 'Enter amount',
		['data-test']: 'create-offer-amount',
	},
];
