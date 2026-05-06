import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type AppPageShellProps = ComponentPropsWithoutRef<'div'> & {
	children: ReactNode;
	containerClassName?: string;
};

export default function AppPageShell({
	children,
	className = '',
	containerClassName = '',
	...props
}: AppPageShellProps) {
	return (
		<div
			{...props}
			className={`min-h-screen bg-[#F7F8FB] px-4 py-4 ${className}`.trim()}
		>
			<div className={`w-full max-w-[1220px] ${containerClassName}`.trim()}>
				{children}
			</div>
		</div>
	);
}
