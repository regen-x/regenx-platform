import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { developerSetupService } from '@/services/developer-setup.service';
import { useUserStore } from '@/store/user.store';

type DeveloperProfileResponse = {
	id?: number | string;
	status?: string;
};

function asDeveloperProfileResponse(
	value: unknown,
): DeveloperProfileResponse | null {
	if (!value || typeof value !== 'object') return null;
	return value as DeveloperProfileResponse;
}

function isDeveloperSetupComplete(profile: DeveloperProfileResponse | null) {
	if (!profile) return false;
	return profile.status === 'completed' || profile.status === 'approved';
}

export default function RequireDeveloperSetup() {
	const location = useLocation();
	const { user } = useUserStore();
	const [loading, setLoading] = useState(true);
	const [allowed, setAllowed] = useState(false);

	useEffect(() => {
		let mounted = true;

		const run = async () => {
			try {
				if (!user) {
					if (mounted) {
						setAllowed(false);
						setLoading(false);
					}
					return;
				}

				const rawProfile = await developerSetupService.getMyProfile();
				const profile = asDeveloperProfileResponse(rawProfile);
				const ok = isDeveloperSetupComplete(profile);

				if (mounted) {
					setAllowed(ok);
					setLoading(false);
				}
			} catch (error) {
				console.error('Developer setup guard failed:', error);
				if (mounted) {
					setAllowed(false);
					setLoading(false);
				}
			}
		};

		run();

		return () => {
			mounted = false;
		};
	}, [user]);

	if (loading) {
		return (
			<div className="p-6 text-sm text-slate-500">
				Checking developer setup...
			</div>
		);
	}

	if (!allowed) {
		return (
			<Navigate
				to="/developer-setup"
				replace
				state={{
					from: location.pathname,
					message: 'Complete Developer Setup before accessing Project Setup.',
				}}
			/>
		);
	}

	return <Outlet />;
}
