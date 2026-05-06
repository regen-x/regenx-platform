import React from 'react';

import PlatformLogo from '@assets/svg/regen-x-logo.svg';

interface IAuthLayoutProps {
	children: React.ReactNode;
}

const AuthLayout = ({ children }: IAuthLayoutProps) => {
	return (
		<div className="flex flex-col lg:flex-row flex-1 items-center justify-center bg-black gap-x-[8rem]">
			<div>
				<img src={PlatformLogo} alt="regen-x-logo" />
			</div>

			{children}
		</div>
	);
};

export default AuthLayout;
