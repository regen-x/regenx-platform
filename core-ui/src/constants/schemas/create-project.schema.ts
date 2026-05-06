import * as yup from 'yup';

import { createProjectSchemaErrors } from '../error/schemas/create-project-schema.error';

const isDateBeforeToday = (value: string) => {
	const today = new Date();
	const date = new Date(value);
	return date >= today;
};

export const createProjectSchema = yup.object({
	name: yup.string().required(createProjectSchemaErrors.NAME_REQUIRED),
	description: yup
		.string()
		.required(createProjectSchemaErrors.DESCRIPTION_REQUIRED),
	location: yup.string().required(createProjectSchemaErrors.LOCATION_REQUIRED),
	fundingGoal: yup
		.number()
		.required(createProjectSchemaErrors.FUNDING_GOAL_REQUIRED)
		.positive(createProjectSchemaErrors.FUNDING_GOAL_POSITIVE),
	startDate: yup
		.string()
		.required(createProjectSchemaErrors.START_DATE_REQUIRED)
		.test(
			'is-start-date-before-end-date',
			createProjectSchemaErrors.START_DATE_BEFORE_END_DATE,
			(value, context) => {
				const startDate = new Date(value);
				const endDate = new Date(context.parent.endDate);
				return startDate < endDate;
			},
		)
		.test(
			'is-start-date-after-today',
			createProjectSchemaErrors.START_DATE_AFTER_TODAY,
			isDateBeforeToday,
		),
	endDate: yup
		.string()
		.required(createProjectSchemaErrors.END_DATE_REQUIRED)
		.test(
			'is-end-date-after-start-date',
			createProjectSchemaErrors.END_DATE_AFTER_START_DATE,
			(value, context) => {
				const startDate = new Date(context.parent.startDate);
				const endDate = new Date(value);
				return startDate < endDate;
			},
		)
		.test(
			'is-start-date-after-today',
			createProjectSchemaErrors.END_DATE_AFTER_TODAY,
			isDateBeforeToday,
		),
	climateImpact: yup
		.string()
		.required(createProjectSchemaErrors.CLIMATE_IMPACT_REQUIRED),
	tokenSupply: yup
		.number()
		.required(createProjectSchemaErrors.TOKEN_SUPPLY_REQUIRED)
		.positive(createProjectSchemaErrors.TOKEN_SUPPLY_POSITIVE)
		.integer(createProjectSchemaErrors.TOKEN_SUPPLY_INTEGER),
	tokenPrice: yup
		.number()
		.required(createProjectSchemaErrors.TOKEN_PRICE_REQUIRED)
		.positive(createProjectSchemaErrors.TOKEN_PRICE_POSITIVE),
	tokenSymbol: yup
		.string()
		.required(createProjectSchemaErrors.TOKEN_SYMBOL_REQUIRED)
		.min(4, createProjectSchemaErrors.TOKEN_SYMBOL_MIN_LENGTH)
		.max(12, createProjectSchemaErrors.TOKEN_SYMBOL_MAX_LENGTH)
		.matches(
			/^[a-zA-Z0-9]+$/,
			createProjectSchemaErrors.TOKEN_SYMBOL_ALPHANUMERIC,
		),
	ownerAddress: yup
		.string()
		.required(createProjectSchemaErrors.OWNER_ADDRESS_REQUIRED)
		.test(
			'is-stellar-address',
			createProjectSchemaErrors.OWNER_ADDRESS_FORMAT,
			(value) => /^G[A-Z2-7]{55}$/.test(value),
		),
	generatesCarbonCredits: yup.boolean(),
	thumbnailUrl: yup
		.string()
		.url('Project image URL must be a valid URL')
		.optional(),
});
