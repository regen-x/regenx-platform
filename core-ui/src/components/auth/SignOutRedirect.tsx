import { useEffect } from 'react';

import { useAuthProvider } from '@/hooks/auth/useAuthProvider';

export default function SignOutRedirect() {
	const { handleSignOut } = useAuthProvider();

	useEffect(() => {
		handleSignOut();
	}, [handleSignOut]);

	return null;
}
