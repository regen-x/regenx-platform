interface IModalButtonProps {
	text: string;
	dataTest?: string;
	disabled?: boolean;
	isLoading?: boolean;
	loadingText?: string;
	onClick: () => void;
}

interface IBaseModalProps extends React.PropsWithChildren {
	title: string;
	dataTest: string;
	isOpen: boolean;
	submitButton?: IModalButtonProps;
	showCloseButtons?: boolean;
	showFooter?: boolean;
	closeButtonDisabled?: boolean;
	closeButtonText?: string;
	closeModal: () => void;
}

const BaseModal = ({
	title,
	children,
	dataTest,
	isOpen,
	submitButton,
	showCloseButtons = true,
	showFooter = true,
	closeButtonDisabled = false,
	closeButtonText = 'Close',
	closeModal,
}: IBaseModalProps) => {
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex justify-center bg-[#0F172A]/45 px-4 py-6 sm:items-center sm:px-6"
			data-test={dataTest}
		>
			<div className="w-full max-w-4xl">
				<div className="max-h-[90vh] overflow-y-auto rounded-[18px] border border-[#E7ECF4] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
					<div className="flex items-center justify-between border-b border-[#E7ECF4] px-6 py-5">
						<h2 className="text-[22px] font-semibold text-[#163F74]">
							{title}
						</h2>

						{showCloseButtons && (
							<button
								type="button"
								className="rounded-[12px] border border-[#E7ECF4] px-3 py-2 text-sm font-semibold text-[#163F74] transition hover:bg-[#F7FAFE] disabled:cursor-not-allowed disabled:opacity-60"
								onClick={closeModal}
								disabled={closeButtonDisabled}
							>
								Close
							</button>
						)}
					</div>

					<div className="px-6 py-4">{children}</div>

					{showFooter && (
						<div className="flex justify-end gap-3 border-t border-[#E7ECF4] px-6 py-4">
							{submitButton && (
								<button
									onClick={submitButton.onClick}
									type="button"
									data-test={submitButton.dataTest || `${dataTest}-submit-btn`}
									disabled={submitButton.disabled || submitButton.isLoading}
									className="min-h-[48px] rounded-[14px] border border-[#2F80ED] bg-[#2F80ED] px-5 text-sm font-semibold text-white transition hover:bg-[#2775E0] disabled:cursor-not-allowed disabled:border-[#C9D7EA] disabled:bg-[#B9CBE5] disabled:text-white"
								>
									{submitButton.isLoading
										? submitButton.loadingText || 'Working...'
										: submitButton.text}
								</button>
							)}

							{showCloseButtons && (
								<button
									className="min-h-[48px] rounded-[14px] border border-[#E7ECF4] bg-white px-5 text-sm font-semibold text-[#163F74] transition hover:bg-[#F7FAFE] disabled:cursor-not-allowed disabled:opacity-60"
									onClick={closeModal}
									type="button"
									data-test={`${dataTest}-close-btn`}
									disabled={closeButtonDisabled}
								>
									{closeButtonText}
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default BaseModal;
