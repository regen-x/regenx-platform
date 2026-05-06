type AdminFilterBarProps = {
	children: React.ReactNode;
	className?: string;
};

export default function AdminFilterBar({
	children,
	className = '',
}: AdminFilterBarProps) {
	return (
		<div
			className={`mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between ${className}`}
		>
			{children}
		</div>
	);
}
