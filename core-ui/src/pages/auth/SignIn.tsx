import AuthLayout from '@/components/auth/AuthLayout';
import SignInForm from '@/components/auth/SignInForm';
import { useAuthProvider } from '@/hooks/auth/useAuthProvider';

export default function SignIn() {
	const { handleSignIn, loadingState } = useAuthProvider();
	return (
		<AuthLayout>
			<SignInForm handleSubmit={handleSignIn} loading={loadingState.signIn} />
		</AuthLayout>
	);
}
