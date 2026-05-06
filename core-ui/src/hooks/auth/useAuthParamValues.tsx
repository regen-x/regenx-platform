import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useAuthParamValues = () => {
	const [searchParams] = useSearchParams();

	const { code, email } = useMemo(() => {
		return {
			code: searchParams.get('code'),
			email: searchParams.get('email'),
		};
	}, [searchParams]);

	return { code, email };
};
