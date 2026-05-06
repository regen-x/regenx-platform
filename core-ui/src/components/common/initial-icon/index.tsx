import { twMerge } from 'tailwind-merge';

interface IInitialIconProps {
	word: string;
	className?: string;
}

const InitialIcon: React.FC<IInitialIconProps> = ({
	word,
	className,
}: IInitialIconProps) => {
	const initial = word.charAt(0).toUpperCase();

	return (
		<div
			className={twMerge(
				'w-12 h-12 rounded-full flex items-center justify-center bg-custom-medium-grey',
				className,
			)}
		>
			{initial}
		</div>
	);
};

export default InitialIcon;
