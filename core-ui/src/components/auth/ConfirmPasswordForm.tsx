import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import Button from '../common/button';
import AuthContainer from './AuthContainer';
import AuthForm from './AuthForm';
import AuthInput from './AuthInput';
import AuthTitle from './AuthTitle';
import { confirmPasswordSchema } from './schemas/confirm-password.schema';

type PropTypes = {
	handleSubmit: (
		username: string,
		newPassword: string,
		code: string,
	) => Promise<void>;
	loading: boolean;
	queryCode: string | null;
	queryEmail: string | null;
};
export default function ConfirmPasswordForm({
	handleSubmit,
	loading,
	queryCode,
	queryEmail,
}: PropTypes) {
	const initialValues = {
		email: queryEmail || '',
		code: queryCode || '',
		password: '',
	};

	return (
		<AuthContainer>
			<Formik
				initialValues={initialValues}
				validationSchema={confirmPasswordSchema}
				onSubmit={({ email, password, code }) =>
					handleSubmit(email, password, code.toString())
				}
			>
				{({ errors, touched }) => (
					<AuthForm>
						<AuthTitle>Confirm password</AuthTitle>
						<AuthInput
							name="email"
							label="Email"
							type="email"
							placeholder="user@example.com"
							error={!!errors.email}
							touched={touched.email}
							data-test="confirm-password-username"
						/>
						<AuthInput
							name="code"
							label="Code"
							type="tel"
							placeholder="123456"
							error={!!errors.code}
							touched={touched.code}
							data-test="confirm-password-code"
						/>
						<AuthInput
							name="password"
							label="New Password"
							type="password"
							placeholder="********"
							error={!!errors.password}
							touched={touched.password}
							data-test="confirm-password-password"
						/>
						<Button
							type="submit"
							isLoading={loading}
							className="w-full mt-0"
							dataTest="confirm-password-submit"
						>
							Reset Password
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
