import { parsePhoneNumberFromString } from 'libphonenumber-js';
import * as yup from 'yup';

import {
	PHONE_NUMBER_COUNTRY_CODE,
	PHONE_NUMBER_INVALID_FORMAT,
	PHONE_REQUIRED,
} from './schema-errors';

export const phoneNumberSchema = yup
	.string()
	.required(PHONE_REQUIRED)
	.test('starts-with-plus', PHONE_NUMBER_COUNTRY_CODE, (value) => {
		return value.startsWith('+');
	})
	.test('is-valid-phone-number', PHONE_NUMBER_INVALID_FORMAT, (value) => {
		if (!value) return false;
		try {
			const phoneNumber = parsePhoneNumberFromString(value);
			return phoneNumber?.isValid();
		} catch {
			return false;
		}
	});
