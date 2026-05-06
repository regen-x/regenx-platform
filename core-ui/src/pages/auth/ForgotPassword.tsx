import AuthLayout from '@/components/auth/AuthLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { useAuthProvider } from '@/hooks/auth/useAuthProvider';

export default function ForgotPassword() {
	const { handleForgotPassword, loadingState } = useAuthProvider();
	return (
		<AuthLayout>
			<ForgotPasswordForm
				handleSubmit={handleForgotPassword}
				loading={loadingState.forgotPassword}
			/>
		</AuthLayout>
	);
}
