import snsWebSdk from '@sumsub/websdk';
import { useRef, useState } from 'react';

import { investorVerificationService } from '@/services/investorVerification.service';

type Props = {
	onStarted?: () => void;
};

export default function SumsubVerifyButton({ onStarted }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const launch = async () => {
		try {
			setIsLoading(true);

			const res = await investorVerificationService.startSumsub();

			if (!res?.token) {
				throw new Error('No token returned from backend');
			}

			setIsOpen(true);

			await new Promise((resolve) => setTimeout(resolve, 0));

			if (!containerRef.current) {
				throw new Error('Sumsub container not mounted');
			}

			const snsWebSdkInstance = snsWebSdk
				.init(res.token, async () => {
					const refreshed = await investorVerificationService.startSumsub();
					if (!refreshed?.token) {
						throw new Error('Failed to refresh Sumsub token');
					}
					return refreshed.token;
				})
				.withConf({
					lang: 'en',
				})
				.withOptions({
					addViewportTag: false,
					adaptIframeHeight: true,
				})
				.on('idCheck.onApplicantStatusChanged', () => {
					onStarted?.();
				})
				.build();

			snsWebSdkInstance.launch(containerRef.current);
		} catch (error) {
			console.error('Sumsub launch failed', error);
			alert('Failed to start Sumsub verification. Check console.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<button
				type="button"
				onClick={launch}
				disabled={isLoading}
				className="rounded-xl bg-[#184F9E] px-8 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(47,128,237,0.14)] transition hover:bg-[#123F82] disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isLoading ? 'Starting verification...' : 'Verify Identity with Sumsub'}
			</button>

			{isOpen ? (
				<div
					ref={containerRef}
					className="mt-5 overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC]"
				/>
			) : null}
		</div>
	);
}
