type DSEType = 'ODSE' | 'DDSE' | 'HDSE';

const styles: Record<DSEType, string> = {
	ODSE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	DDSE: 'border-amber-200 bg-amber-50 text-amber-700',
	HDSE: 'border-blue-200 bg-blue-50 text-blue-700',
};

const labels: Record<DSEType, string> = {
	ODSE: 'Operating DSE',
	DDSE: 'Development DSE',
	HDSE: 'Hybrid DSE',
};

const DSEBadge = ({ type }: { type: DSEType }) => {
	return (
		<div
			className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[type]}`}
		>
			{labels[type]}
		</div>
	);
};

export default DSEBadge;
