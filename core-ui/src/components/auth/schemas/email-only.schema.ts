import * as yup from 'yup';

import { EMAIL_INVALID, EMAIL_REQUIRED } from './schema-errors';

export const emailOnlySchema = yup.object({
	email: yup.string().email(EMAIL_INVALID).required(EMAIL_REQUIRED),
});
