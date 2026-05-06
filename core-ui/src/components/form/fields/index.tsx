import { Fragment } from 'react';

import GenericInput, { IGenericInput } from '../input/generic-input';

interface IFormFieldsProps {
	fields: IGenericInput[];
	handleKeyDown?: () => void;
}

const FormFields = ({ fields, handleKeyDown }: IFormFieldsProps) => {
	return (
		<Fragment>
			{fields.map((fieldProps, index) => (
				<GenericInput key={index} {...fieldProps} onKeyDown={handleKeyDown} />
			))}
		</Fragment>
	);
};

export default FormFields;
