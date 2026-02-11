import type { OutputMessage, ProviderFailure, Round7PipelineHttpResult, ScenePlan } from './types';

export function buildProviderErrorResponse(params: {
	requestId: string;
	scenePlan: ScenePlan;
	summaryUsed: boolean;
	errors: ProviderFailure[];
	message?: string;
}): Round7PipelineHttpResult {
	const message = params.message ?? 'AI provider failed to generate a response.';
	return {
		status: 502,
		body: {
			success: false,
			requestId: params.requestId,
			summaryUsed: params.summaryUsed,
			scenePlan: {
				...params.scenePlan,
				errorMode: 'hard_error'
			},
			messages: [],
			errors: params.errors,
			error: {
				code: 'provider_error',
				message,
				requestId: params.requestId
			}
		}
	};
}

export function buildSuccessResponse(params: {
	requestId: string;
	scenePlan: ScenePlan;
	summaryUsed: boolean;
	messages: OutputMessage[];
	errors: ProviderFailure[];
}): Round7PipelineHttpResult {
	return {
		status: 200,
		body: {
			success: true,
			provider: 'iaedu',
			model: 'iaedu',
			requestId: params.requestId,
			summaryUsed: params.summaryUsed,
			scenePlan: params.scenePlan,
			messages: params.messages,
			errors: params.errors
		}
	};
}

