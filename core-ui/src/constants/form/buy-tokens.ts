import { IGenericInput } from '@/components/form/input/generic-input';
import { ICreateTransfer } from '@/interfaces/services/IContractService';

export const buyTokensInitialValues: ICreateTransfer = {
	amount: 0,
	investorAddress: '',
	tokenAddress: '',
};

export const buyTokensFormGenericFields: IGenericInput[] = [
	{
		name: 'investorAddress',
		label: 'Investor Address',
		type: 'text',
		placeholder: 'Enter investor address',
		hidden: true,
		['data-test']: 'create-transfer-investor-address',
	},
	{
		name: 'amount',
		label: 'Amount',
		type: 'number',
		placeholder: 'Enter amount',
		['data-test']: 'create-transfer-amount',
	},
	{
		name: 'tokenAddress',
		label: 'Token Address',
		type: 'text',
		placeholder: 'Enter token address',
		hidden: true,
		['data-test']: 'create-transfer-token-address',
	},
];
