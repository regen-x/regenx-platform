interface IAuthDescriptionProps {
	description: string;
}

const AuthDescription = ({ description }: IAuthDescriptionProps) => {
	return (
		<p className="mb-3 text-custom-grey" data-test="auth-description">
			{description}
		</p>
	);
};

export default AuthDescription;
