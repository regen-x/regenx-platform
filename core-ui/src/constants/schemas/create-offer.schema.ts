import * as yup from 'yup';

import { createOfferSchemaErrors } from '../error/schemas/create-project-schema.error';

export const createOfferSchema = yup.object({
	price: yup
		.number()
		.required(createOfferSchemaErrors.PRICE_REQUIRED)
		.positive(createOfferSchemaErrors.PRICE_POSITIVE),
	amount: yup
		.number()
		.required(createOfferSchemaErrors.AMOUNT_REQUIRED)
		.positive(createOfferSchemaErrors.AMOUNT_POSITIVE),
	projectUuid: yup
		.string()
		.required(createOfferSchemaErrors.PROJECT_UUID_REQUIRED),
});
