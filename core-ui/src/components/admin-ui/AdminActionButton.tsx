import { ButtonHTMLAttributes, ReactNode } from 'react';

type AdminActionButtonProps = {
	children: ReactNode;
	tone?: 'primary' | 'secondary' | 'danger' | 'pink';
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
	type?: 'button' | 'submit';
} & ButtonHTMLAttributes<HTMLButtonElement>;

const styles = {
	primary: 'bg-[#2F80ED] text-white border border-[#2F80ED] hover:bg-[#2775E0]',
	secondary:
		'bg-white text-[#163F74] border border-[#E7ECF4] hover:bg-[#F7FAFE]',
	danger: 'bg-white text-[#D14343] border border-[#F2C6C6] hover:bg-[#FEF6F6]',
	pink: 'bg-[#FFF2F6] text-[#C95B87] border border-[#F2C5D4] hover:bg-[#FFEAF1]',
};

export default function AdminActionButton({
	children,
	tone = 'secondary',
	disabled = false,
	onClick,
	className = '',
	type = 'button',
	...props
}: AdminActionButtonProps) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			{...props}
			className={`rounded-[14px] px-5 py-3 text-sm font-semibold transition ${
				disabled
					? 'cursor-not-allowed border border-[#E4E7EC] bg-[#EDF1F5] text-[#98A2B3]'
					: styles[tone]
			} ${className}`}
		>
			{children}
		</button>
	);
}
