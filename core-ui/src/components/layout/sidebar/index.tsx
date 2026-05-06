import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getMenuItems } from './constants/SidebarMenuItems';

import { AUTH_PREFIX, PATHS } from '@/constants/routes/paths';
import { REGENX_TIPS } from '@/constants/tips';
import { useUserStore } from '@/store/user.store';

import Logo from '@assets/png/logo-dark.png';

const hash = (str: string) => {
	let h = 0;
	for (let i = 0; i < str.length; i += 1) {
		h = (h << 5) - h + str.charCodeAt(i);
		h |= 0;
	}
	return h;
};

const Sidebar = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useUserStore();

	const menuItems = useMemo(() => getMenuItems(user?.type), [user?.type]);

	const currentTip = useMemo(() => {
		const tipIndex = Math.abs(hash(location.pathname)) % REGENX_TIPS.length;
		return REGENX_TIPS[tipIndex];
	}, [location.pathname]);

	const handleLogout = () => {
		navigate(`/${AUTH_PREFIX}/${PATHS.SIGN_OUT}`);
	};

	return (
		<div className="theme-sidebar-shell flex h-full w-[260px] flex-col border-r px-4 py-6">
			<div
				className="mb-6 flex cursor-pointer items-center gap-2 px-2"
				onClick={() => navigate('/')}
			>
				<img
					src={Logo}
					alt="RegenX"
					className="theme-image-none h-10 w-auto object-contain"
				/>
				<span className="theme-heading text-lg font-semibold">RegenX</span>
			</div>

			<div className="flex flex-1 flex-col gap-2">
				{menuItems.map((item) => (
					<div
						key={item.label}
						onClick={() => {
							if (item.path === '/project-setup') {
								navigate(item.path);
								return;
							}

							navigate(item.path);
						}}
						className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
							location.pathname === item.path
								? 'theme-sidebar-item-active'
								: 'theme-sidebar-item'
						}`}
					>
						{item.icon}
						<span>{item.label}</span>
					</div>
				))}
			</div>

			<div className="mt-6 rounded-[14px] border border-[#F5D58A] bg-[#FFF7E6] p-4 text-sm text-[#5F6C86]">
				<p className="font-semibold text-[#8A5A00]">Tips</p>
				<p className="mt-1">{currentTip}</p>
			</div>

			<div className="theme-sidebar-profile mt-6 rounded-2xl border p-4">
				<div className="flex items-center gap-3">
					<div className="theme-sidebar-avatar flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold">
						{user?.fullName?.charAt(0) || 'U'}
					</div>

					<div>
						<p className="theme-heading text-sm font-semibold">
							{user?.fullName ?? user?.email ?? 'User'}
						</p>
						<p className="theme-text-secondary text-xs capitalize">
							{user?.type?.replace(/([A-Z])/g, ' $1')}
						</p>
					</div>
				</div>

				<button
					onClick={handleLogout}
					className="theme-button-primary mt-4 w-full rounded-xl py-2 text-sm font-medium shadow-sm"
				>
					Sign out
				</button>
			</div>
		</div>
	);
};

export default Sidebar;
