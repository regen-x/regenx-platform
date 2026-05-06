import { useMemo } from 'react';

interface IChartInvestment {
	id: string | number;
	name: string;
	symbol: string;
	tokenPrice: number;
	purchased: number;
	invested: number;
	createdAt: string;
}

interface IPortfolioChartsProps {
	investments: IChartInvestment[];
	variant?: 'full' | 'allocation-only';
}

const COLORS = ['#ec4899', '#38bdf8', '#facc15'];

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const polarToCartesian = (
	cx: number,
	cy: number,
	r: number,
	angleInDegrees: number,
) => {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

	return {
		x: cx + r * Math.cos(angleInRadians),
		y: cy + r * Math.sin(angleInRadians),
	};
};

const describeArc = (
	cx: number,
	cy: number,
	r: number,
	startAngle: number,
	endAngle: number,
) => {
	const start = polarToCartesian(cx, cy, r, endAngle);
	const end = polarToCartesian(cx, cy, r, startAngle);
	const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

	return [
		'M',
		start.x,
		start.y,
		'A',
		r,
		r,
		0,
		largeArcFlag,
		0,
		end.x,
		end.y,
	].join(' ');
};

const buildSmoothPath = (points: Array<{ x: number; y: number }>): string => {
	if (!points.length) return '';
	if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

	let d = `M ${points[0].x} ${points[0].y}`;

	for (let i = 0; i < points.length - 1; i += 1) {
		const current = points[i];
		const next = points[i + 1];
		const controlX = (current.x + next.x) / 2;

		d += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
	}

	return d;
};

const PortfolioCharts: React.FC<IPortfolioChartsProps> = ({
	investments,
	variant = 'full',
}) => {
	const totalInvested = useMemo(
		() =>
			investments.reduce((sum, item) => sum + Number(item.invested || 0), 0),
		[investments],
	);

	const allocationData = useMemo(() => {
		if (!totalInvested) return [];

		return investments.map((item, index) => ({
			...item,
			percentage: (Number(item.invested || 0) / totalInvested) * 100,
			color: COLORS[index % COLORS.length],
		}));
	}, [investments, totalInvested]);

	const pieSlices = useMemo(() => {
		let cumulativeAngle = 0;

		return allocationData.map((item) => {
			const sliceAngle = (item.percentage / 100) * 360;
			const startAngle = cumulativeAngle;
			const endAngle = cumulativeAngle + sliceAngle;
			cumulativeAngle = endAngle;

			return {
				...item,
				path: describeArc(130, 130, 88, startAngle, endAngle),
			};
		});
	}, [allocationData]);

	const timelineData = useMemo(() => {
		const sorted = [...investments].sort(
			(a, b) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		);

		let runningTotal = 0;

		return sorted.map((item) => {
			runningTotal += Number(item.invested || 0);

			return {
				label: item.name,
				dateLabel: new Date(item.createdAt).toLocaleDateString(),
				cumulative: runningTotal,
			};
		});
	}, [investments]);

	const chartGeometry = useMemo(() => {
		const width = 460;
		const height = 240;
		const leftPadding = 56;
		const rightPadding = 20;
		const topPadding = 20;
		const bottomPadding = 34;

		const maxValue = Math.max(
			...timelineData.map((item) => item.cumulative),
			1,
		);
		const ticks = 4;
		const yValues = Array.from({ length: ticks + 1 }, (_, i) =>
			Math.round((maxValue * (ticks - i)) / ticks),
		);

		const points = timelineData.map((item, index) => {
			const x =
				timelineData.length === 1
					? width / 2
					: leftPadding +
					  (index * (width - leftPadding - rightPadding)) /
							(timelineData.length - 1);

			const y =
				topPadding +
				((maxValue - item.cumulative) / maxValue) *
					(height - topPadding - bottomPadding);

			return {
				...item,
				x,
				y,
			};
		});

		const linePath = buildSmoothPath(points);

		const areaPath = points.length
			? `${linePath} L ${points[points.length - 1].x} ${
					height - bottomPadding
			  } L ${points[0].x} ${height - bottomPadding} Z`
			: '';

		return {
			width,
			height,
			leftPadding,
			rightPadding,
			topPadding,
			bottomPadding,
			maxValue,
			yValues,
			points,
			linePath,
			areaPath,
		};
	}, [timelineData]);

	if (!investments.length) return null;

	if (variant === 'allocation-only') {
		return (
			<div className="px-4 pb-4">
				<div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
					<svg
						width="220"
						height="220"
						viewBox="0 0 260 260"
						className="shrink-0"
					>
						<defs>
							{allocationData.map((slice, index) => (
								<linearGradient
									key={slice.id}
									id={`allocationDonutGradient-${index}`}
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
									<stop offset="0%" stopColor={slice.color} stopOpacity="1" />
									<stop
										offset="100%"
										stopColor={slice.color}
										stopOpacity="0.7"
									/>
								</linearGradient>
							))}
						</defs>

						<circle
							cx="130"
							cy="130"
							r="88"
							fill="none"
							stroke="#e5e7eb"
							strokeWidth="30"
						/>

						{pieSlices.map((slice, index) => (
							<path
								key={slice.id}
								d={slice.path}
								fill="none"
								stroke={`url(#allocationDonutGradient-${index})`}
								strokeWidth="30"
								strokeLinecap="round"
							/>
						))}

						<circle cx="130" cy="130" r="60" fill="#ffffff" />

						<text
							x="130"
							y="120"
							textAnchor="middle"
							className="fill-gray-500 text-[13px]"
						>
							Portfolio
						</text>
						<text
							x="130"
							y="146"
							textAnchor="middle"
							className="fill-gray-900 text-[18px] font-semibold"
						>
							{formatCurrency(totalInvested)}
						</text>
					</svg>

					<div className="w-full space-y-4">
						{allocationData.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between gap-3"
							>
								<div className="flex min-w-0 items-center gap-3">
									<span
										className="h-4 w-4 shrink-0 rounded-full"
										style={{ backgroundColor: item.color }}
									/>
									<div className="min-w-0">
										<div className="truncate text-sm font-medium text-[#1B2F56]">
											{item.name}
										</div>
										<div className="text-xs text-[#8B98AF]">
											{formatCurrency(Number(item.invested || 0))}
										</div>
									</div>
								</div>

								<div className="shrink-0 text-sm font-semibold text-[#163F74]">
									{item.percentage.toFixed(0)}%
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4 border-b border-gray-200">
			<div className="bg-gray-50 rounded-xl p-5 shadow-sm">
				<h3 className="text-base font-semibold text-gray-900 mb-4">
					Portfolio Allocation
				</h3>

				<div className="flex flex-col md:flex-row items-center gap-6">
					<svg
						width="260"
						height="260"
						viewBox="0 0 260 260"
						className="shrink-0 drop-shadow-md"
					>
						<defs>
							{allocationData.map((slice, index) => (
								<linearGradient
									key={slice.id}
									id={`donutGradient-${index}`}
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
									<stop offset="0%" stopColor={slice.color} stopOpacity="1" />
									<stop
										offset="100%"
										stopColor={slice.color}
										stopOpacity="0.7"
									/>
								</linearGradient>
							))}
						</defs>

						<circle
							cx="130"
							cy="130"
							r="88"
							fill="none"
							stroke="#e5e7eb"
							strokeWidth="30"
						/>

						{pieSlices.map((slice, index) => (
							<path
								key={slice.id}
								d={slice.path}
								fill="none"
								stroke={`url(#donutGradient-${index})`}
								strokeWidth="30"
								strokeLinecap="round"
								className="drop-shadow-sm"
							/>
						))}

						<circle cx="130" cy="130" r="60" fill="#ffffff" fillOpacity="0.9" />

						<text
							x="130"
							y="120"
							textAnchor="middle"
							className="fill-gray-500 text-[13px]"
						>
							Total
						</text>
						<text
							x="130"
							y="146"
							textAnchor="middle"
							className="fill-gray-900 text-[18px] font-semibold"
						>
							{formatCurrency(totalInvested)}
						</text>
					</svg>

					<div className="w-full flex flex-col gap-4">
						{allocationData.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between gap-3"
							>
								<div className="flex items-center gap-3 min-w-0">
									<span
										className="w-4 h-4 rounded-full shrink-0 shadow-sm"
										style={{ backgroundColor: item.color }}
									/>
									<span className="text-sm text-gray-800 truncate">
										{item.name}
									</span>
								</div>

								<div className="text-sm text-gray-600 shrink-0">
									{item.percentage.toFixed(0)}%
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="bg-gray-50 rounded-xl p-5 shadow-sm">
				<h3 className="text-base font-semibold text-gray-900 mb-4">
					Cumulative Investment
				</h3>

				<svg
					width="100%"
					height="260"
					viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
					preserveAspectRatio="none"
				>
					{chartGeometry.yValues.map((value, index) => {
						const y =
							chartGeometry.topPadding +
							(index *
								(chartGeometry.height -
									chartGeometry.topPadding -
									chartGeometry.bottomPadding)) /
								chartGeometry.yValues.length;

						return (
							<g key={value}>
								<line
									x1={chartGeometry.leftPadding}
									y1={y}
									x2={chartGeometry.width - chartGeometry.rightPadding}
									y2={y}
									stroke="#e5e7eb"
									strokeWidth="1"
								/>
								<text
									x={chartGeometry.leftPadding - 8}
									y={y + 4}
									textAnchor="end"
									className="fill-gray-500 text-[11px]"
								>
									{value.toLocaleString()}
								</text>
							</g>
						);
					})}

					<line
						x1={chartGeometry.leftPadding}
						y1={chartGeometry.topPadding}
						x2={chartGeometry.leftPadding}
						y2={chartGeometry.height - chartGeometry.bottomPadding}
						stroke="#d1d5db"
						strokeWidth="1"
					/>
					<line
						x1={chartGeometry.leftPadding}
						y1={chartGeometry.height - chartGeometry.bottomPadding}
						x2={chartGeometry.width - chartGeometry.rightPadding}
						y2={chartGeometry.height - chartGeometry.bottomPadding}
						stroke="#d1d5db"
						strokeWidth="1"
					/>

					{chartGeometry.areaPath && (
						<path
							d={chartGeometry.areaPath}
							fill="#38bdf8"
							fillOpacity="0.12"
						/>
					)}

					{chartGeometry.linePath && (
						<path
							d={chartGeometry.linePath}
							fill="none"
							stroke="#38bdf8"
							strokeWidth="4"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					)}

					{chartGeometry.points.map((dot, index) => (
						<g key={`${dot.label}-${index}`}>
							<circle
								cx={dot.x}
								cy={dot.y}
								r="6"
								fill="#ffffff"
								stroke="#38bdf8"
								strokeWidth="3"
							/>
						</g>
					))}
				</svg>

				<div className="flex justify-between gap-2 mt-2 ml-[56px]">
					{timelineData.map((item, index) => (
						<div
							key={`${item.label}-${index}`}
							className="text-[11px] text-gray-500 text-center flex-1"
						>
							{item.dateLabel}
						</div>
					))}
				</div>

				<div className="mt-3 text-sm text-gray-600">
					Total invested: {formatCurrency(totalInvested)}
				</div>
			</div>
		</div>
	);
};

export default PortfolioCharts;
