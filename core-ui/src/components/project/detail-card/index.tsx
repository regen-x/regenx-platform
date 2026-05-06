import type { ReactNode } from 'react';

interface IDetailCardItemProps {
	label: string;
	value: ReactNode;
	dataTest?: string;
	href?: string;
}

interface IDetailCardProps {
	cardTitle: string;
	items: IDetailCardItemProps[];
	dataTest?: string;
}

const DetailCard = ({ cardTitle, dataTest, items }: IDetailCardProps) => {
	return (
		<div className="mb-4 flex w-full flex-col rounded-xl border border-slate-200 bg-white px-4 pt-4 shadow-sm">
			<p
				className="pb-3 text-lg font-semibold text-custom-dark-blue"
				data-test={dataTest}
			>
				{cardTitle}
			</p>

			<div className="space-y-3 pb-4">
				{items.map(({ label, value, dataTest: itemDataTest, href }) => (
					<div
						className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
						key={label}
					>
						<h2 className="mb-1 text-sm font-semibold text-slate-600">
							{label}
						</h2>

						{href ? (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm font-semibold text-primary hover:underline"
								data-test={itemDataTest}
							>
								{value}
							</a>
						) : (
							<p className="text-sm text-slate-900" data-test={itemDataTest}>
								{value}
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default DetailCard;
