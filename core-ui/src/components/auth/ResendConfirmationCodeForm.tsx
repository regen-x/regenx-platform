import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import Button from '../common/button';
import AuthContainer from './AuthContainer';
import AuthForm from './AuthForm';
import AuthInput from './AuthInput';
import AuthTitle from './AuthTitle';
import { emailOnlySchema } from './schemas/email-only.schema';

type PropTypes = {
	handleSubmit: (username: string) => Promise<void>;
	loading: boolean;
};
export default function ResendConfirmationCodeForm({
	handleSubmit,
	loading,
}: PropTypes) {
	const initialValues = {
		email: '',
	};
	return (
		<AuthContainer>
			<Formik
				initialValues={initialValues}
				validationSchema={emailOnlySchema}
				onSubmit={({ email }) => handleSubmit(email)}
			>
				{({ errors, touched }) => (
					<AuthForm>
						<AuthTitle>Resend verification link</AuthTitle>
						<AuthInput
							name="email"
							label="Email"
							type="email"
							placeholder="user@example.com"
							error={!!errors.email}
							touched={touched.email}
							data-test="resend-confirmation-code-username"
						/>
						<Button
							type="submit"
							isLoading={loading}
							className="w-full mt-0"
							dataTest="resend-confirmation-code-submit"
						>
							Resend link
						</Button>
						<p className="text-custom-grey mt-4 mb-5">
							New user?{' '}
							<Link
								to="/auth/sign-up"
								data-test="link-sign-up"
								className="text-custom-green underline font-medium"
							>
								Sign Up
							</Link>
						</p>
					</AuthForm>
				)}
			</Formik>
		</AuthContainer>
	);
}
