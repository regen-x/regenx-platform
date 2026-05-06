import { IApiResponseError } from '@/interfaces/api/IApiResponseError';

export class ApiResponseError extends Error implements IApiResponseError {
	error: {
		detail: string;
		source: { pointer: string };
		status: string;
		title: string;
	};
	constructor(
		detail: string,
		source: { pointer: string },
		status: string,
		title: string,
	) {
		super(detail);
		this.error = {
			detail,
			source,
			status,
			title,
		};
	}
}
