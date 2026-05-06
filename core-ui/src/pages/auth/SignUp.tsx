import AuthLayout from '@/components/auth/AuthLayout';
import SignUpForm from '@/components/auth/SignUpForm';
import { useAuthProvider } from '@/hooks/auth/useAuthProvider';

export default function SignUp() {
	const { handleSignUp, loadingState } = useAuthProvider();
	return (
		<AuthLayout>
			<SignUpForm handleSubmit={handleSignUp} loading={loadingState.signUp} />
		</AuthLayout>
	);
}
