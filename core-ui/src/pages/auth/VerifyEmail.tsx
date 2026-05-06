import AuthLayout from '@/components/auth/AuthLayout';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export default function VerifyEmail() {
	return (
		<AuthLayout>
			<VerifyEmailForm />
		</AuthLayout>
	);
}
