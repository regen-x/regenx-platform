import { ErrorMessage, Field } from 'formik';
import { twMerge } from 'tailwind-merge';

export interface ISelectInput {
	name: string;
	label: string;
	placeholder?: string;
	error?: boolean;
	touched?: boolean;
	options: { label: string; value: string | undefined }[];
}

const SelectInput = ({
	name,
	label,
	placeholder,
	error,
	touched,
	options,
	...props
}: ISelectInput) => {
	return (
		<div
			className={twMerge(
				'flex flex-col relative font-mono w-full my-2 min-h-14 autofill:font-mono',
			)}
		>
			<label
				className={twMerge(
					'text-xs font-light absolute bg-white text-gray-400 top-[-8px] left-[16px] px-1 rounded-full',
				)}
				htmlFor={name}
			>
				{label}
			</label>
			<Field
				className="border-[1px] border-gray-400 rounded-md px-5 py-2 text-sm focus:border-blue-500 outline-none focus:shadow-blue-500/30 focus:shadow-outline data-[error=true]:border-red-500"
				as="select"
				id={name}
				name={name}
				placeholder={placeholder || ''}
				data-error={error && touched}
				{...props}
			>
				<option value="" disabled>
					Select an option
				</option>
				{options.map((option) => (
					<option
						key={option.value}
						value={option.value}
						className="capitalize"
					>
						{option.label}
					</option>
				))}
			</Field>

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

export default SelectInput;
