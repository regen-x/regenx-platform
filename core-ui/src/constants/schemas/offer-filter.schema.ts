import * as Yup from 'yup';

export const offerFilterSchema = Yup.object().shape({
	tokenSymbol: Yup.string().optional(),
});
