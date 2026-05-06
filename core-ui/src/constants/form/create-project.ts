import { IGenericInput } from '@/components/form/input/generic-input';
import { ICreateProject } from '@/interfaces/services/IProjectService';

export const createProjectInitialValues: ICreateProject = {
	name: '',
	description: '',
	location: '',
	fundingGoal: 0,
	startDate: '',
	endDate: '',
	climateImpact: '',
	tokenSupply: 0,
	tokenPrice: 0,
	tokenSymbol: '',
	ownerAddress: '',
	thumbnailUrl: '',
	generatesCarbonCredits: false,
};

export const createProjectFormFields: IGenericInput[] = [
	{
		name: 'name',
		label: 'Project name',
		type: 'text',
		['data-test']: 'create-project-name',
	},
	{
		name: 'description',
		label: 'Project description',
		type: 'text',
		['data-test']: 'create-project-description',
	},
	{
		name: 'location',
		label: 'Project location',
		type: 'text',
		['data-test']: 'create-project-location',
	},
	{
		name: 'fundingGoal',
		label: 'Funding goal (AUD)',
		type: 'number',
		['data-test']: 'create-project-funding-goal',
	},
	{
		name: 'startDate',
		label: 'Start date',
		type: 'date',
		['data-test']: 'create-project-start-date',
	},
	{
		name: 'endDate',
		label: 'End date',
		type: 'date',
		['data-test']: 'create-project-end-date',
	},
	{
		name: 'climateImpact',
		label: 'Climate impact',
		type: 'text',
		['data-test']: 'create-project-climate-impact',
	},
	{
		name: 'tokenSupply',
		label: 'Token supply',
		type: 'number',
		['data-test']: 'create-project-token-supply',
	},
	{
		name: 'tokenPrice',
		label: 'Price per token (USDC)',
		type: 'number',
		['data-test']: 'create-project-token-price',
	},
	{
		name: 'tokenSymbol',
		label: 'Token symbol',
		type: 'text',
		['data-test']: 'create-project-token-symbol',
	},
	{
		name: 'ownerAddress',
		label: 'Token owner wallet address',
		type: 'text',
		['data-test']: 'create-project-owner-address',
	},

	{
		name: 'thumbnailUrl',
		label: 'Project Image URL',
		type: 'text',
		placeholder: 'https://example.com/project-image.png',
	},

	{
		name: 'generatesCarbonCredits',
		label: 'Generates Renewable Energy Certificates',
		type: 'checkbox',
		['data-test']: 'create-project-generates-carbon-credits',
	},
];
