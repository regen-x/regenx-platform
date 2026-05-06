import AuthLayout from '@/components/auth/AuthLayout';
import ResendConfirmationCodeForm from '@/components/auth/ResendConfirmationCodeForm';
import { useAuthProvider } from '@/hooks/auth/useAuthProvider';

export default function ResendConfirmationCode() {
	const { handleResendConfirmationCode, loadingState } = useAuthProvider();
	return (
		<AuthLayout>
			<ResendConfirmationCodeForm
				handleSubmit={handleResendConfirmationCode}
				loading={loadingState.resendConfirmationCode}
			/>
		</AuthLayout>
	);
}
