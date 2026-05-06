import React from 'react';

interface HeaderProps {
	title: string;
	description?: string;
	className?: string;
}

const Header: React.FC<HeaderProps> = ({
	title,
	description,
	className = '',
}) => {
	return (
		<header className={`mb-6 ${className}`.trim()} data-test="header">
			<h1
				className="theme-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em]"
				data-test="header-title"
			>
				{title}
			</h1>

			{description ? (
				<p
					className="theme-text-secondary mt-1 text-base font-medium"
					data-test="header-description"
				>
					{description}
				</p>
			) : null}
		</header>
	);
};

export default Header;
