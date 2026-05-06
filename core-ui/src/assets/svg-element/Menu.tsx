import React from 'react';

interface MenuIconProps {
	className?: string;
}

const MenuIcon: React.FC<MenuIconProps> = ({ className = '' }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M4 6h16M4 12h16M4 18h16" />
	</svg>
);

export default MenuIcon;
