import React from 'react';

type ButtonProps = {
	children: React.ReactNode;
	onClick?: () => void;
	className?: string;
	type?: 'button' | 'submit';
	disabled?: boolean;
};

export default function Button({
	children,
	onClick,
	className = '',
	type = 'button',
	disabled = false,
}: ButtonProps) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`inline-flex items-center justify-center rounded-[20px] bg-[#5B84F1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4F76DF] disabled:opacity-50 ${className}`}
		>
			{children}
		</button>
	);
}
