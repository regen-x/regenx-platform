import * as yup from 'yup';

import { phoneNumberSchema } from './phoneNumber.schema';
import {
	CONFIRM_PASSWORD_REQUIRED,
	DOB_REQUIRED,
	EMAIL_INVALID,
	EMAIL_REQUIRED,
	FULLNAME_REQUIRED,
	PASSWORDS_MATCH,
	PASSWORD_LOWERCASE,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	PASSWORD_NUMBER,
	PASSWORD_REQUIRED,
	PASSWORD_SPECIAL,
	PASSWORD_UPPERCASE,
	USER_TYPE_REQUIRED,
} from './schema-errors';

import { UserType } from '@/constants/enum/user-type.enum';

export const signUpSchema = yup.object({
	email: yup.string().email(EMAIL_INVALID).required(EMAIL_REQUIRED),
	password: yup
		.string()
		.required(PASSWORD_REQUIRED)
		.min(8, PASSWORD_MIN_LENGTH)
		.max(50, PASSWORD_MAX_LENGTH)
		.matches(/[a-z]/, PASSWORD_LOWERCASE)
		.matches(/[A-Z]/, PASSWORD_UPPERCASE)
		.matches(/[0-9]/, PASSWORD_NUMBER)
		.matches(/\W/, PASSWORD_SPECIAL),
	fullname: yup.string().required(FULLNAME_REQUIRED),
	birthdate: yup.date().required(DOB_REQUIRED),
	['phone-number']: phoneNumberSchema,
	['confirm-password']: yup
		.string()
		.required(CONFIRM_PASSWORD_REQUIRED)
		.oneOf([yup.ref('password')], PASSWORDS_MATCH),
	type: yup.string().required(USER_TYPE_REQUIRED).oneOf(Object.keys(UserType)),
});
