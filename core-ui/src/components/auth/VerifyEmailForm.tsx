import { Link } from 'react-router-dom';

import AuthContainer from './AuthContainer';
import AuthDescription from './AuthDescription';
import AuthTitle from './AuthTitle';

export function VerifyEmailForm() {
	return (
		<AuthContainer>
			<div className="mx-auto w-[24rem] flex flex-col items-center bg-white py-4 px-6 rounded-[23px]">
				<AuthTitle>Verify email</AuthTitle>
				<AuthDescription description="We've sent a verification link to your email. Click the link to verify your account." />
				<p className="text-custom-grey mt-4 mb-2">
					Didn't receive the link?{' '}
					<Link
						to="/auth/resend-confirmation-code"
						data-test="link-resend-confirmation-code"
						className="text-custom-green underline font-medium"
					>
						Resend
					</Link>
				</p>
				<p className="text-custom-grey mb-5">
					<Link
						to="/auth/sign-in"
						data-test="link-sign-in"
						className="text-custom-green underline font-medium"
					>
						Sign in
					</Link>
				</p>
			</div>
		</AuthContainer>
	);
}
