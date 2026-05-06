import { shortenStellarAddress } from '@/utils/shorten-stellar-address';

interface IWalletDetailsProps {
	publicKey: string;
	xlmBalance?: number | null;
	auddBalance?: number | null;
	detailsTitle: string;
	notConnectedMessage: string;
	dataTest?: string;
}

const formatBalance = (value?: number | null) => {
	if (value == null || Number.isNaN(Number(value))) {
		return 'Unavailable';
	}

	return Number(value).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

const WalletDetails = ({
	publicKey,
	xlmBalance = null,
	auddBalance = null,
	detailsTitle,
	notConnectedMessage,
	dataTest,
}: IWalletDetailsProps) => {
	return (
		<div
			className="rounded-[18px] border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]"
			data-test={dataTest}
		>
			{publicKey ? (
				<div>
					<h3 className="text-[18px] font-semibold text-[#163F74]">
						{detailsTitle}
					</h3>

					<div className="mt-4 grid gap-4 md:grid-cols-3">
						<div className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								Public key
							</p>
							<p className="mt-2 text-[15px] font-semibold text-[#1B2F56]">
								{shortenStellarAddress(publicKey)}
							</p>
						</div>

						<div className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								XLM Balance
							</p>
							<p
								data-test={`${dataTest}-xlm-balance`}
								className="mt-2 text-[15px] font-semibold text-[#1B2F56]"
							>
								{formatBalance(xlmBalance)}
								{xlmBalance != null ? ' XLM' : ''}
							</p>
						</div>

						<div className="rounded-[18px] border border-[#E7ECF4] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
							<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8FA0B8]">
								AUDD Balance
							</p>
							<p
								data-test={`${dataTest}-audd-balance`}
								className="mt-2 text-[15px] font-semibold text-[#1B2F56]"
							>
								{formatBalance(auddBalance)}
								{auddBalance != null ? ' AUDD' : ''}
							</p>
							<p className="mt-1 text-xs text-slate-400">Testnet stablecoin</p>
						</div>
					</div>

					<div className="mt-4 text-xs text-slate-500">
						Multi-asset support: XLM, AUDD, and tokenised energy assets
					</div>
				</div>
			) : (
				<div className="w-full justify-center items-center">
					<h3 className="font-semibold text-lg">{notConnectedMessage}</h3>
				</div>
			)}
		</div>
	);
};

export default WalletDetails;
