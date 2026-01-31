export type TimelineSenderType = 'human' | 'ai';
export type TimelineMessageStatus = 'sending' | 'sent' | 'failed';

export interface TimelineMessage {
	// Stable key for UI dedupe (e.g. `db:123:0` or `temp:abc123`)
	key: string;
	dbId?: number;
	clientTempId?: string;

	round: number;
	senderType: TimelineSenderType;
	// For humans: usually the numeric player id as a string. For AIs: the agent id.
	senderId: string;
	// For AI messages coming from the DB we may need the role to resolve the current agent id.
	senderRole?: string;
	senderName: string;

	content: string;
	createdAt: string; // ISO string
	status: TimelineMessageStatus;
}

function compareTimelineMessages(a: TimelineMessage, b: TimelineMessage) {
	const ta = Date.parse(a.createdAt);
	const tb = Date.parse(b.createdAt);
	if (ta !== tb) return ta - tb;
	return a.key.localeCompare(b.key);
}

export class DiscussionTimelineState {
	messages = $state<TimelineMessage[]>([]);

	reset() {
		this.messages = [];
	}

	upsert(next: TimelineMessage | TimelineMessage[]) {
		const items = Array.isArray(next) ? next : [next];
		if (items.length === 0) return;

		const map = new Map<string, TimelineMessage>();
		for (const msg of this.messages) map.set(msg.key, msg);
		for (const msg of items) map.set(msg.key, msg);

		this.messages = Array.from(map.values()).sort(compareTimelineMessages);
	}

	removeByKey(key: string) {
		this.messages = this.messages.filter((m) => m.key !== key);
	}

	removeByClientTempId(clientTempId: string) {
		this.messages = this.messages.filter((m) => m.clientTempId !== clientTempId);
	}

	markFailedByClientTempId(clientTempId: string) {
		this.messages = this.messages.map((m) =>
			m.clientTempId === clientTempId ? { ...m, status: 'failed' } : m
		);
	}
}
