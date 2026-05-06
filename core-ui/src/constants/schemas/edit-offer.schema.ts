import * as yup from 'yup';

import { createOfferSchemaErrors } from '../error/schemas/create-project-schema.error';

export const editOfferPriceSchema = yup.object({
	price: yup
		.number()
		.positive(createOfferSchemaErrors.PRICE_POSITIVE)
		.required(createOfferSchemaErrors.PRICE_REQUIRED),
});
