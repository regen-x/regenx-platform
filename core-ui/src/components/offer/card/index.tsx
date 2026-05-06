import TokenLink from '@/components/common/TokenLink';
import Button from '@/components/common/button';
import { IOffer } from '@/interfaces/api/IOffer';

interface IOfferCardProps {
	offer: IOffer;
	isLoadingBuyOffer?: boolean;
	isLoadingCancelOffer?: boolean;
	isLoadingUpdateOffer?: boolean;
	onBuyOffer?: () => void;
	onCancelOffer?: () => void;
	onEditOfferPrice?: () => void;
	isOwnerOffer: boolean;
}

const OfferCard: React.FC<IOfferCardProps> = ({
	offer: { id, price, project, amount, createdAt, isActive },
	isLoadingBuyOffer,
	isLoadingCancelOffer,
	isLoadingUpdateOffer,
	onBuyOffer,
	onCancelOffer,
	onEditOfferPrice,
	isOwnerOffer = false,
}: IOfferCardProps) => {
	const offerButtons = [
		{
			label: 'Buy',
			onClick: onBuyOffer,
			isLoading: isLoadingBuyOffer,
			dataTest: `offer-buy-${id}`,
			isOwnerOffer: false,
			className: 'w-full md:w-auto',
		},
		{
			label: 'Cancel',
			onClick: onCancelOffer,
			isLoading: isLoadingCancelOffer,
			dataTest: `offer-cancel-${id}`,
			className: 'w-full md:w-auto bg-red-500',
			isOwnerOffer: true,
		},
		{
			label: 'Edit',
			onClick: onEditOfferPrice,
			isLoading: isLoadingUpdateOffer,
			dataTest: `offer-edit-${id}`,
			className: 'w-full md:w-auto bg-blue-500 text-white',
			isOwnerOffer: true,
		},
	];
	return (
		<div
			className="bg-white rounded-xl shadow-lg w-full overflow-hidden"
			data-test={`offer-card-${id}`}
		>
			<div className="flex flex-col md:flex-row p-4 justify-around">
				<div className="flex w-full md:w-[40%] justify-center md:justify-between items-center mb-2">
					<div className="items-center flex flex-col pr-2">
						<h3
							className="text-2xl text-center font-semibold"
							data-test={`offer-token-name-${id}`}
						>
							{project.name}
						</h3>

						<h3
							className="text-2xl font-semibold"
							data-test={`offer-token-symbol-${id}`}
						>
							<TokenLink
								assetCode={project.assetCode || project.tokenSymbol}
								assetIssuer={project.assetIssuer}
								status={project.status}
								className="hover:underline"
							>
								{project.tokenSymbol || project.assetCode || 'TOKEN'}
							</TokenLink>
						</h3>
					</div>
				</div>

				<div className="flex-col w-full md:w-[60%]">
					<div className="flex flex-col md:flex-row justify-around">
						<div className="mt-2 flex flex-col">
							<p className="text-gray-600">Price</p>
							<p
								className="font-bold text-xl"
								data-test={`offer-token-price-${id}`}
							>
								${price.toFixed(2)}
							</p>
						</div>
						<div className="mt-2 flex flex-col">
							<p className="text-gray-600">Amount</p>
							<p
								className="font-bold text-xl"
								data-test={`offer-token-amount-${id}`}
							>
								{amount.toFixed(2)}
							</p>
						</div>
						<div className="mt-2 flex flex-col">
							<p className="text-gray-600">Created at</p>
							<p
								className="font-bold text-xl"
								data-test={`offer-token-created-at-${id}`}
							>
								{new Date(createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>

					{!isActive && (
						<p
							className="text-red-600 font-mono text-center pt-3"
							data-test={`offer-token-is-active-${id}`}
						>
							{!amount ? 'Sold' : 'Inactive'}
						</p>
					)}

					<div className="mt-1 flex flex-wrap items-center justify-center gap-3">
						{offerButtons
							.filter(
								(button) => button.isOwnerOffer === isOwnerOffer && isActive,
							)
							.map((button) => (
								<Button
									key={button.label}
									type="button"
									onClick={button.onClick}
									className={button.className}
									dataTest={button.dataTest}
									isLoading={button.isLoading}
								>
									{button.label}
								</Button>
							))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default OfferCard;
