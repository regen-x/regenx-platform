import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { IMenuItem } from '@/interfaces/layout/IMenuItem';

interface ISidebarLinkItemProps {
	item: IMenuItem;
	onClick?: () => void;
	isCollapsed?: boolean;
	isMobile?: boolean;
}

const SidebarLinkItem: React.FC<ISidebarLinkItemProps> = ({
	item: { path, icon, key, title },
	onClick,
	isCollapsed,
	isMobile,
}) => {
	const location = useLocation();

	const isActive =
		path === '/dashboard'
			? location.pathname === '/dashboard'
			: location.pathname.startsWith(path);

	const showLabel = isMobile || !isCollapsed;

	return (
		<Link
			to={`${path}/`}
			data-test={`menu-item-${key}`}
			onClick={onClick}
			className={twMerge(
				'relative flex h-10 items-center gap-3 rounded-l-xl px-3 text-sm font-medium transition-all',
				!isMobile && isCollapsed ? 'justify-center' : '',
				isActive
					? 'bg-[#E6F4EA] text-[#1D3B2F]'
					: 'text-[#667085] hover:bg-[#EEF1F4] hover:text-[#344054]',
			)}
		>
			<span
				className={twMerge(
					'flex h-4 w-4 shrink-0 items-center justify-center',
					isActive ? 'text-[#1D3B2F]' : 'text-[#667085]',
				)}
			>
				{icon}
			</span>

			{showLabel && <span className="truncate">{title}</span>}

			{isActive && (
				<span className="absolute right-[-6px] top-1/2 h-7 w-[10px] -translate-y-1/2 rounded-l-full bg-[#1D3B2F]" />
			)}
		</Link>
	);
};

export default SidebarLinkItem;
