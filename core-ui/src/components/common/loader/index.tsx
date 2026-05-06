import { twMerge } from 'tailwind-merge';

interface ILoaderProps {
	className?: string;
}

const Loader = ({ className }: ILoaderProps) => {
	return (
		<div className="flex flex-1 justify-center items-start w-full h-[10rem]">
			<div
				className={twMerge(
					'w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]',
					className,
				)}
			/>
		</div>
	);
};

export default Loader;
