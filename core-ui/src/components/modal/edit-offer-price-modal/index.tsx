import BaseModal from '../base-modal';

import EditOfferPriceForm from '@/components/form/edit-offer-price-form';
import { IEditOfferPrice } from '@/interfaces/services/IOfferService';

interface IEditOfferPriceModalProps {
	isOpen: boolean;
	showCloseButtons?: boolean;
	onSubmit: (editOfferPriceFields: IEditOfferPrice) => Promise<void>;
	closeModal: () => void;
}

const EditOfferPriceModal = ({
	isOpen,
	showCloseButtons,
	onSubmit,
	closeModal,
}: IEditOfferPriceModalProps) => {
	return (
		<BaseModal
			title="Edit offer price"
			showCloseButtons={showCloseButtons}
			showFooter={false}
			isOpen={isOpen}
			closeModal={closeModal}
			dataTest="edit-offer-price-modal"
		>
			<EditOfferPriceForm handleSubmit={onSubmit} />
		</BaseModal>
	);
};

export default EditOfferPriceModal;
