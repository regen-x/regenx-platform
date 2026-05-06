import React from 'react';
import { twMerge } from 'tailwind-merge';

import Loader from '../loader';

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	dataTest: string;
	children: React.ReactNode;
	isLoading?: boolean;
	loaderClassName?: string;
}

const Button = ({
	isLoading,
	disabled,
	dataTest,
	className,
	children,
	loaderClassName,
	...props
}: IButtonProps) => {
	return (
		<button
			className={twMerge(
				'bg-primary hover:filter hover:brightness-105 mt-2 px-6 rounded-[23px] font-semibold py-3 text-md disabled:cursor-not-allowed text-black min-w-[9rem]',
				className,
			)}
			disabled={isLoading || disabled}
			data-test={dataTest}
			{...props}
		>
			{isLoading ? (
				<div className="flex h-8">
					<Loader className={loaderClassName} />
				</div>
			) : (
				children
			)}
		</button>
	);
};

export default Button;
