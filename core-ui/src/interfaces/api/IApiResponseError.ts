export interface IApiResponseError {
	error: {
		detail: string;
		source: {
			pointer: string;
		};
		status: string;
		title: string;
	};
}
