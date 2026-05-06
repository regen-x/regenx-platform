import AuthLayout from '@/components/auth/AuthLayout';
import ConfirmPasswordForm from '@/components/auth/ConfirmPasswordForm';
import { useAuthParamValues } from '@/hooks/auth/useAuthParamValues';
import { useAuthProvider } from '@/hooks/auth/useAuthProvider';

export default function ConfirmPassword() {
	const { loadingState, handleConfirmPassword } = useAuthProvider();
	const { code, email } = useAuthParamValues();

	return (
		<AuthLayout>
			<ConfirmPasswordForm
				loading={loadingState.confirmPassword}
				handleSubmit={handleConfirmPassword}
				queryCode={code}
				queryEmail={email}
			/>
		</AuthLayout>
	);
}
