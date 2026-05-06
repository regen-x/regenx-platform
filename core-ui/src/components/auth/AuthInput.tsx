import { ErrorMessage, Field } from 'formik';

type PropTypes = {
	name: string;
	label: string;
	type: 'email' | 'password' | 'text' | 'tel' | 'date';
	placeholder?: string;
	error?: boolean;
	touched?: boolean;
};
export default function AuthInput({
	name,
	label,
	type,
	placeholder,
	error,
	touched,
	...props
}: PropTypes) {
	return (
		<div className="flex flex-col relative font-mono w-full my-2 min-h-14 autofill:font-mono my-4">
			<label
				className="text-xs font-light absolute bg-white text-gray-400 top-[-8px] left-[16px] px-1 rounded-full"
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
			/>
			<div className="w-full h-3" data-test={`form-input-error-${name}`}>
				<ErrorMessage
					className="text-red-500 text-xs w-full"
					name={name}
					component="p"
				/>
			</div>
		</div>
	);
}
