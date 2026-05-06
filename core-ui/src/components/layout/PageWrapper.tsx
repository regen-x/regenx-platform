import React from 'react';

interface PageWrapperProps {
	children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
	return (
		<div className="min-h-screen bg-[#F8FAFC] px-8 py-8">
			<div className="w-full max-w-[1600px]">{children}</div>
		</div>
	);
};

export default PageWrapper;
