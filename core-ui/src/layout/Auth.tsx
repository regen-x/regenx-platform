import { Outlet } from 'react-router-dom';

import RequireAuth from '@/components/auth/RequireAuth';
import Sidebar from '@/components/layout/sidebar';

export default function AuthLayout() {
	return (
		<RequireAuth>
			<div className="theme-page-shell flex min-h-screen">
				<div className="hidden h-screen sticky top-0 md:block">
					<Sidebar />
				</div>

				<div className="fixed left-0 right-0 top-0 z-50 md:hidden">
					<Sidebar />
				</div>

				<main className="theme-page-shell min-w-0 flex-1">
					<div className="w-full max-w-full overflow-x-hidden px-4 py-4 md:px-6 md:py-5 md:mt-0 mt-16">
						<Outlet />
					</div>
				</main>
			</div>
		</RequireAuth>
	);
}
