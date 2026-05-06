import type { ReactNode } from 'react';

import { getAssetUrl } from '@/utils/stellarAsset';

type TokenLinkProps = {
	assetCode?: string | null;
	assetIssuer?: string | null;
	status?: string | null;
	children?: ReactNode;
	className?: string;
};

function canLinkToken(status?: string | null) {
	return status === 'issued' || status === 'live';
}

export default function TokenLink({
	assetCode,
	assetIssuer,
	status,
	children,
	className,
}: TokenLinkProps) {
	const fallbackLabel =
		String(assetCode || '').trim() ||
		String(assetIssuer || '').trim() ||
		'TOKEN';
	const label = children ?? fallbackLabel;
	const url = canLinkToken(status) ? getAssetUrl(assetCode, assetIssuer) : null;

	if (!url) {
		return <span className={className}>{label}</span>;
	}

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className={className}
		>
			{label}
		</a>
	);
}
