import {
	Building2,
	FolderCog,
	FolderOpen,
	LayoutDashboard,
	Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
	{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
	{ label: 'Developer Setup', icon: Building2, href: '/developer-setup' },
	{ label: 'Project Setup', icon: FolderCog, href: '/project-setup' },
	{ label: 'Deal Room', icon: FolderOpen, href: '/projects' },
	{ label: 'Cash Account', icon: Wallet, href: '/cash-account' },
];

export default function SidebarMenu() {
	return (
		<aside className="w-[220px] bg-[#F5F6F8] border-r border-[#E4E7EC] px-3 py-5">
			<nav className="space-y-1">
				{navItems.map((item) => {
					const Icon = item.icon;

					return (
						<NavLink key={item.label} to={item.href}>
							{({ isActive }) => (
								<div
									className={`relative flex h-10 items-center gap-3 rounded-l-xl px-3 text-sm font-medium transition-all
                  ${
										isActive
											? 'bg-[#E6F4EA] text-[#1D3B2F]'
											: 'text-[#667085] hover:bg-[#EEF1F4] hover:text-[#344054]'
									}`}
								>
									<Icon
										className={`h-4 w-4 shrink-0 ${
											isActive ? 'text-[#1D3B2F]' : 'text-[#667085]'
										}`}
										strokeWidth={2}
									/>

									<span>{item.label}</span>

									{isActive && (
										<div className="absolute right-[-6px] top-1/2 h-7 w-[10px] -translate-y-1/2 rounded-l-full bg-[#1D3B2F]" />
									)}
								</div>
							)}
						</NavLink>
					);
				})}
			</nav>
		</aside>
	);
}
