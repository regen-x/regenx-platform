import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import Button from '../common/button';
import AuthContainer from './AuthContainer';
import AuthDescription from './AuthDescription';
import AuthForm from './AuthForm';
import AuthInput from './AuthInput';
import AuthSelect from './AuthSelect';
import AuthTitle from './AuthTitle';
import { signUpSchema } from './schemas/sign-up.schema';

import { SIGN_UP_USER_TYPE_SELECT_ITEMS } from '@/constants/auth/select-items';
import { UserType } from '@/constants/enum/user-type.enum';

type PropTypes = {
	handleSubmit: (
		email: string,
		password: string,
		type: UserType,
		fullname: string,
		phoneNumber: string,
		birthdate: string,
	) => Promise<void>;
	loading: boolean;
};
export default function SignUpForm({ handleSubmit, loading }: PropTypes) {
	const initialValues = {
		email: '',
		password: '',
		fullname: '',
		birthdate: '',
		['phone-number']: '',
		['confirm-password']: '',
		type: '' as keyof typeof UserType,
	};

	return (
		<AuthContainer>
			<Formik
				initialValues={initialValues}
				validationSchema={signUpSchema}
				onSubmit={({
					email,
					password,
					fullname,
					'phone-number': phoneNumber,
					birthdate,
					type,
				}) =>
					handleSubmit(
						email,
						password,
						UserType[type],
						fullname,
						phoneNumber,
						birthdate,
					)
				}
			>
				{({ errors, touched }) => (
					<AuthForm>
						<AuthTitle>Create an account</AuthTitle>
						<AuthDescription description="Enter your details to create an account" />
						<AuthInput
							name="fullname"
							label="Full name"
							type="text"
							placeholder="John Doe"
							error={!!errors.fullname}
							touched={touched.fullname}
							data-test="sign-up-name"
						/>
						<AuthInput
							name="email"
							label="Email address"
							type="email"
							placeholder="user@example.com"
							error={!!errors.email}
							touched={touched.email}
							data-test="sign-up-username"
						/>
						<AuthInput
							name="phone-number"
							label="Mobile number"
							type="tel"
							placeholder="+6123456789"
							error={!!errors['phone-number']}
							touched={touched['phone-number']}
							data-test="sign-up-phone"
						/>
						<AuthInput
							name="birthdate"
							label="Date of birth"
							type="date"
							placeholder="01/01/2000"
							error={!!errors.birthdate}
							touched={touched.birthdate}
							data-test="sign-up-dob"
						/>
						<AuthInput
							name="password"
							label="Password"
							type="password"
							placeholder="********"
							error={!!errors.password}
							touched={touched.password}
							data-test="sign-up-password"
						/>
						<AuthInput
							name="confirm-password"
							label="Confirm password"
							type="password"
							placeholder="********"
							error={!!errors['confirm-password']}
							touched={touched['confirm-password']}
							data-test="sign-up-confirm-password"
						/>
						<AuthSelect
							name="type"
							label="Type of account"
							error={!!errors.type}
							touched={touched.type}
							data-test="sign-up-type"
							options={SIGN_UP_USER_TYPE_SELECT_ITEMS}
						/>
						<Button
							type="submit"
							isLoading={loading}
							className="w-full mt-0 text-white"
							dataTest="sign-up-submit"
						>
							Create account
						</Button>
						<p className="text-custom-grey mt-4 mb-2">
							Existing user?{' '}
							<Link
								to="/auth/sign-in"
								data-test="link-sign-in"
								className="text-custom-green underline font-medium"
							>
								Log in
							</Link>
						</p>
					</AuthForm>
				)}
			</Formik>
		</AuthContainer>
	);
}
