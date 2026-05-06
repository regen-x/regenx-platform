import { Navigate } from 'react-router-dom';

import { IReactChildrenProps } from '@/interfaces/IReactChildren';
import { StoredCookies } from '@/interfaces/auth/cookies.enum';
import { cookieService } from '@/services/cookie.service';

export default function RouteWithoutAuth({ children }: IReactChildrenProps) {
	const isAuthenticated = !!cookieService.getCookie(StoredCookies.ACCESS_TOKEN);

	if (isAuthenticated) {
		return <Navigate to={`/dashboard`} replace={true} />;
	} else {
		return <>{children}</>;
	}
}
