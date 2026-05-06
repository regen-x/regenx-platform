import { IGenericInput } from '@/components/form/input/generic-input';

export const offerFilterInitialValues = {
	tokenSymbol: '',
};

export const offerFilterFormGenericFields: IGenericInput[] = [
	{
		name: 'tokenSymbol',
		label: 'Token Symbol',
		placeholder: 'Enter token symbol',
		type: 'text',
		['data-test']: 'offer-filter-by-token-symbol',
	},
];
