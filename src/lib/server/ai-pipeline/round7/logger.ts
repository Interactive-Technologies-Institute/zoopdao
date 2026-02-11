import type { Round7PipelineLogLevel } from './types';

function shouldLog(level: Round7PipelineLogLevel, target: Round7PipelineLogLevel): boolean {
	if (level === 'off') return false;
	if (level === 'full') return true;
	return target === 'step';
}

export function createRound7PipelineLogger(params: {
	requestId: string;
	level: Round7PipelineLogLevel;
}) {
	const { requestId, level } = params;
	const base = { requestId };

	return {
		step(name: string, details?: Record<string, unknown>) {
			if (!shouldLog(level, 'step')) return;
			console.info(`[round7:v2] ${name}`, { ...base, ...(details ?? {}) });
		},
		full(name: string, details?: Record<string, unknown>) {
			if (!shouldLog(level, 'full')) return;
			console.info(`[round7:v2:full] ${name}`, { ...base, ...(details ?? {}) });
		},
		warn(name: string, details?: Record<string, unknown>) {
			if (level === 'off') return;
			console.warn(`[round7:v2] ${name}`, { ...base, ...(details ?? {}) });
		},
		error(name: string, details?: Record<string, unknown>) {
			if (level === 'off') return;
			console.error(`[round7:v2] ${name}`, { ...base, ...(details ?? {}) });
		}
	};
}

