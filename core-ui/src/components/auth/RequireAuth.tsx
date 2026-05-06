import { useEffect } from 'react';

import Loader from '@/components/common/loader';
import { useAuthProvider } from '@/hooks/auth/useAuthProvider';
import { IReactChildrenProps } from '@/interfaces/IReactChildren';

export default function RequireAuth({ children }: IReactChildrenProps) {
	const { handleRefreshSession, loadingState } = useAuthProvider();

	useEffect(() => {
		handleRefreshSession();
	}, [handleRefreshSession]);

	if (loadingState.refreshSession)
		return (
			<div className="flex flex-1 items-center justify-center flex-col">
				<div className="flex flex-1 items-center justify-center">
					<Loader />
				</div>
			</div>
		);
	else return <>{children}</>;
}
