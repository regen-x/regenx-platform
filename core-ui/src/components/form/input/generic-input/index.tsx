import { ErrorMessage, Field } from 'formik';
import { twMerge } from 'tailwind-merge';

export interface IGenericInput {
	name: string;
	label: string;
	type: 'email' | 'password' | 'text' | 'tel' | 'date' | 'number' | 'checkbox';
	placeholder?: string;
	error?: boolean;
	touched?: boolean;
	hidden?: boolean;
	['data-test']?: string;
	onKeyDown?: () => void;
}

const GenericInput = ({
	name,
	label,
	type,
	placeholder,
	error,
	touched,
	hidden,
	onKeyDown,
	...props
}: IGenericInput) => {
	return (
		<div
			className={twMerge(
				'flex flex-col relative font-mono w-full my-2 min-h-14 autofill:font-mono',
				type === 'checkbox' && 'flex-row static gap-x-2',
				hidden && 'hidden',
			)}
		>
			<label
				className={twMerge(
					'text-xs font-light absolute bg-white text-gray-400 top-[-8px] left-[16px] px-1 rounded-full',
					type === 'checkbox' && 'static',
				)}
				htmlFor={name}
			>
				{label}
			</label>
			<Field
				className="border-[1px] border-gray-400 rounded-md px-5 py-2 text-sm focus:border-blue-500 outline-none focus:shadow-blue-500/30 focus:shadow-outline data-[error=true]:border-red-500"
				type={type}
				id={name}
				name={name}
				placeholder={placeholder || ''}
				data-error={error && touched}
				{...props}
				onKeyDown={onKeyDown}
			/>
			<div
				className="mt-1 min-h-[20px] w-full"
				data-test={`form-input-error-${name}`}
			>
				<ErrorMessage
					className="text-red-500 text-xs w-full"
					name={name}
					component="p"
				/>
			</div>
		</div>
	);
};

export default GenericInput;
