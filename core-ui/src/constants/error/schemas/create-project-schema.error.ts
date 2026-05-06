export const createProjectSchemaErrors = {
	NAME_REQUIRED: 'Project name is required',
	DESCRIPTION_REQUIRED: 'Project description is required',
	LOCATION_REQUIRED: 'Project location is required',
	FUNDING_GOAL_REQUIRED: 'Funding goal is required',
	FUNDING_GOAL_POSITIVE: 'Funding goal must be a positive number',
	START_DATE_REQUIRED: 'Start date is required',
	START_DATE_AFTER_TODAY: 'Start date must be in the future',
	START_DATE_BEFORE_END_DATE: 'Start date must be before end date',
	END_DATE_REQUIRED: 'End date is required',
	END_DATE_AFTER_TODAY: 'End date must be in the future',
	END_DATE_AFTER_START_DATE: 'End date must be after start date',
	CLIMATE_IMPACT_REQUIRED: 'Climate impact is required',
	TOKEN_SUPPLY_REQUIRED: 'Token supply is required',
	TOKEN_SUPPLY_POSITIVE: 'Token supply must be a positive number',
	TOKEN_SUPPLY_INTEGER: 'Token supply must be an integer',
	TOKEN_PRICE_REQUIRED: 'Token price is required',
	TOKEN_PRICE_POSITIVE: 'Token price must be a positive number',
	TOKEN_SYMBOL_REQUIRED: 'Token symbol is required',
	TOKEN_SYMBOL_MIN_LENGTH: 'Token symbol should have at least 4 characters',
	TOKEN_SYMBOL_MAX_LENGTH: 'Token symbol should have at most 12 characters',
	TOKEN_SYMBOL_ALPHANUMERIC:
		'Token symbol must be alphanumeric (a-z, A-Z, 0-9)',
	OWNER_ADDRESS_REQUIRED: 'Wallet public key is required',
	OWNER_ADDRESS_FORMAT: 'Must be a valid Stellar public key',
};

export const createOfferSchemaErrors = {
	PRICE_REQUIRED: 'Price is required',
	PRICE_POSITIVE: 'Price must be a positive number',
	AMOUNT_REQUIRED: 'Amount is required',
	AMOUNT_POSITIVE: 'Amount must be a positive number',
	PROJECT_UUID_REQUIRED: 'Project token is required',
};
