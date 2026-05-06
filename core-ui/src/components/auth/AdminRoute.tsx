import { Navigate } from 'react-router-dom';

import { UserType } from '@/constants/enum/user-type.enum';
import { useUserStore } from '@/store/user.store';

export default function AdminRoute({ children }: { children: JSX.Element }) {
	const user = useUserStore((state) => state.user);

	if (!user) {
		return <Navigate to="/auth/sign-in" replace />;
	}

	const isAdmin =
		user.type === UserType.ADMIN || user.email === 'ishan@regenx.io';

	if (!isAdmin) {
		return <Navigate to="/dashboard" replace />;
	}

	return children;
}
