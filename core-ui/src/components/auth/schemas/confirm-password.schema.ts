import * as yup from 'yup';

import {
	CODE_MIN_LENGTH,
	CODE_REQUIRED,
	CODE_TYPE,
	EMAIL_INVALID,
	EMAIL_REQUIRED,
	PASSWORD_LOWERCASE,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	PASSWORD_NUMBER,
	PASSWORD_REQUIRED,
	PASSWORD_SPECIAL,
	PASSWORD_UPPERCASE,
} from './schema-errors';

export const confirmPasswordSchema = yup.object({
	email: yup.string().email(EMAIL_INVALID).required(EMAIL_REQUIRED),
	code: yup
		.number()
		.typeError(CODE_TYPE)
		.test(
			'minLength',
			CODE_MIN_LENGTH,
			(val) => (val && val.toString().length >= 6) || false,
		)
		.required(CODE_REQUIRED),
	password: yup
		.string()
		.min(8, PASSWORD_MIN_LENGTH)
		.max(50, PASSWORD_MAX_LENGTH)
		.matches(/[a-z]/, PASSWORD_LOWERCASE)
		.matches(/[A-Z]/, PASSWORD_UPPERCASE)
		.matches(/[0-9]/, PASSWORD_NUMBER)
		.matches(/\W/, PASSWORD_SPECIAL)
		.required(PASSWORD_REQUIRED),
});
