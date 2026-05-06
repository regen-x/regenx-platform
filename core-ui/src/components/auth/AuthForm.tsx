import { Form } from 'formik';

import { IReactChildrenProps } from '@/interfaces/IReactChildren';

export default function AuthForm({ children }: IReactChildrenProps) {
	return (
		<Form className="mx-auto w-[24rem] flex flex-col items-center bg-white py-4 px-6 rounded-[23px]">
			{children}
		</Form>
	);
}
