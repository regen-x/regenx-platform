import { ReactNode } from 'react';

type PageShellProps = {
	title: string;
	subtitle?: string;
	children: ReactNode;
};

export default function PageShell({
	title,
	subtitle,
	children,
}: PageShellProps) {
	return (
		<div className="w-full">
			<div className="mb-8">
				<h1 className="theme-heading text-3xl font-semibold leading-tight md:text-4xl">
					{title}
				</h1>

				{subtitle ? (
					<p className="theme-text-secondary mt-2 text-sm md:text-base">
						{subtitle}
					</p>
				) : null}
			</div>

			<div className="w-full">{children}</div>
		</div>
	);
}
