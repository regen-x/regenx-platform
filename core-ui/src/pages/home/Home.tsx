import { useNavigate } from 'react-router-dom';

import Button from '@/components/common/button';

import PlatformLogo from '@assets/svg/regen-x-logo.svg';

export default function Home() {
	const navigate = useNavigate();

	return (
		<div className="flex items-center justify-center h-screen flex-col bg-black">
			<div>
				<img src={PlatformLogo} alt="regen-x-logo" data-test="regen-x-logo" />
			</div>
			<div className="mt-[min(5%,9rem)]">
				<Button
					type="button"
					className="w-[18rem]"
					dataTest="log-in"
					onClick={() => navigate('/auth/sign-in')}
				>
					Log In
				</Button>
			</div>
		</div>
	);
}
