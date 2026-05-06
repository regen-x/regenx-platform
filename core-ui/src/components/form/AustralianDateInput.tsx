import { format, isValid, parse } from 'date-fns';
import { enAU } from 'date-fns/locale';
import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type AustralianDateInputProps = {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
	name?: string;
};

const DISPLAY_FORMAT = 'dd/MM/yyyy';
const ISO_FORMAT = 'yyyy-MM-dd';

const parseIsoDate = (value: string): Date | null => {
	if (!value) return null;

	const parsedIso = parse(value, ISO_FORMAT, new Date());
	if (isValid(parsedIso)) return parsedIso;

	const parsedDisplay = parse(value, DISPLAY_FORMAT, new Date());
	if (isValid(parsedDisplay)) return parsedDisplay;

	const nativeParsed = new Date(value);
	return isValid(nativeParsed) ? nativeParsed : null;
};

const toIsoDate = (date: Date | null): string => {
	if (!date || !isValid(date)) return '';
	return format(date, ISO_FORMAT);
};

const CustomInput = forwardRef<
	HTMLButtonElement,
	{
		value?: string;
		onClick?: () => void;
		className?: string;
		placeholder?: string;
		disabled?: boolean;
		id?: string;
		name?: string;
	}
>(function CustomInput(
	{ value, onClick, className = '', placeholder, disabled, id, name },
	ref,
) {
	return (
		<button
			type="button"
			ref={ref}
			onClick={onClick}
			disabled={disabled}
			id={id}
			name={name}
			className={`${className} text-left`}
		>
			{value || placeholder || 'dd/mm/yyyy'}
		</button>
	);
});

export default function AustralianDateInput({
	value,
	onChange,
	className = '',
	placeholder = 'dd/mm/yyyy',
	disabled = false,
	id,
	name,
}: AustralianDateInputProps) {
	const selectedDate = parseIsoDate(value);

	return (
		<DatePicker
			selected={selectedDate}
			onChange={(date: Date | null) => onChange(toIsoDate(date))}
			dateFormat={DISPLAY_FORMAT}
			locale={enAU}
			placeholderText={placeholder}
			disabled={disabled}
			showMonthDropdown
			showYearDropdown
			dropdownMode="select"
			isClearable
			customInput={
				<CustomInput
					className={className}
					placeholder={placeholder}
					disabled={disabled}
					id={id}
					name={name}
				/>
			}
		/>
	);
}
