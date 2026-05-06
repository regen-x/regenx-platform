import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import Button from '../common/button';
import AuthContainer from './AuthContainer';
import AuthDescription from './AuthDescription';
import AuthForm from './AuthForm';
import AuthInput from './AuthInput';
import AuthTitle from './AuthTitle';
import { signInSchema } from './schemas/sign-in.schema';

type PropTypes = {
	handleSubmit: (email: string, password: string) => Promise<void>;
	loading: boolean;
};

export default function SignInForm({ handleSubmit, loading }: PropTypes) {
	const initialValues = {
		email: '',
		password: '',
	};

	return (
		<AuthContainer>
			<Formik
				initialValues={initialValues}
				validationSchema={signInSchema}
				onSubmit={({ email, password }) => handleSubmit(email, password)}
			>
				{({ errors, touched }) => (
					<AuthForm>
						<AuthTitle>Log In</AuthTitle>
						<AuthDescription description="Enter your email and password to login" />

						<AuthInput
							label="Email address"
							name="email"
							type="email"
							placeholder="user@example.com"
							error={!!errors.email}
							touched={touched.email}
							data-test="sign-in-username"
						/>

						<AuthInput
							label="Password"
							name="password"
							type="password"
							placeholder="********"
							error={!!errors.password}
							touched={touched.password}
							data-test="sign-in-password"
						/>

						<Link
							className="font-medium text-custom-green mb-7 self-end underline"
							to="/auth/forgot-password"
							data-test="link-forgot-password"
						>
							Forgot password?
						</Link>

						<Button
							type="submit"
							disabled={loading}
							isLoading={loading}
							className="w-full mt-0"
							dataTest="sign-in-submit"
						>
							Log In
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
