import { IComponentIconProps } from '@/interfaces/common/IComponentIcon';

const ChevronLeftIcon = ({ className }: IComponentIconProps) => {
	return (
		<svg
			width="6"
			height="10"
			viewBox="0 0 6 10"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5.2756 0.39131C5.51968 0.635388 5.51968 1.03112 5.2756 1.27519L1.55088 4.99992L5.2756 8.72464C5.51968 8.96872 5.51968 9.36445 5.2756 9.60853C5.03152 9.8526 4.63579 9.8526 4.39172 9.60853L0.22505 5.44186C-0.0190272 5.19778 -0.0190272 4.80205 0.22505 4.55798L4.39172 0.39131C4.63579 0.147233 5.03152 0.147233 5.2756 0.39131Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default ChevronLeftIcon;
