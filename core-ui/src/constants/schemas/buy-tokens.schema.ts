import * as yup from 'yup';

import { buyTokensSchemaErrors } from '../error/schemas/buy-tokens-schema.error';

export const buyTokensSchema = yup.object({
	amount: yup
		.number()
		.required(buyTokensSchemaErrors.AMOUNT_REQUIRED)
		.positive(buyTokensSchemaErrors.AMOUNT_POSITIVE),
	investorAddress: yup
		.string()
		.required(buyTokensSchemaErrors.INVESTOR_ADDRESS_REQUIRED),
	tokenAddress: yup
		.string()
		.required(buyTokensSchemaErrors.TOKEN_ADDRESS_REQUIRED),
});
