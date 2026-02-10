<script lang="ts">
	import { X } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import { getLocale } from '@src/paraglide/runtime.js';

	interface Message {
		id: string;
		content: string;
		senderType: 'human' | 'ai';
		senderName: string;
		round: number;
		timestamp: Date;
		status?: 'sending' | 'sent' | 'failed';
	}

	interface DiscussionHistoryDialogProps {
		open: boolean;
		messages: Message[];
		onClose?: () => void;
	}

	let { open = $bindable(false), messages = [], onClose }: DiscussionHistoryDialogProps = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-x-0 top-0 bottom-[11rem] sm:bottom-[10.5rem] bg-transparent z-[120] flex items-end sm:items-center justify-center p-3 sm:p-4"
		onclick={handleClose}
		role="button"
		tabindex="0"
	>
		<!-- Dialog Panel -->
		<div
			class="w-full max-w-[860px] h-full max-h-[760px] bg-gradient-to-b from-dark-deep to-midnight bos-surface rounded-3xl shadow-2xl border border-ice/15 bos-border flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="history-title"
		>
			<!-- Header -->
			<div class="shrink-0 bg-gradient-to-r from-charcoal to-graphite bos-surface rounded-t-3xl px-5 sm:px-8 py-5 sm:py-6 border-b border-ice/15 bos-border flex items-center justify-between gap-4">
				<h2 id="history-title" class="text-2xl font-semibold text-white bos-text">
					{m.message_history()}
				</h2>
				
				<!-- Close Button -->
				<button
					type="button"
					onclick={handleClose}
					class="w-11 h-11 rounded-full bg-charcoal hover:bg-tertiary/40 transition-colors flex items-center justify-center border border-ice/20 bos-surface bos-border bos-text"
					aria-label={m.close()}
				>
					<X class="w-6 h-6 text-white bos-text" />
				</button>
			</div>

			<!-- Scrollable Content Area -->
			<div class="history-scroll flex-1 min-h-0 p-4 sm:p-8 overflow-y-auto">
				<div class="bg-dark-deep/70 bos-surface rounded-2xl p-4 sm:p-6 border border-ice/10 bos-border min-h-full">
					{#if messages.length === 0}
						<div class="flex items-center justify-center h-full text-ice/70 bos-muted">
							<p class="text-lg">{m.no_messages_yet()}</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each messages as message (message.id)}
								<div
									class="rounded-2xl p-6 shadow-lg {message.senderType === 'human'
										? 'bg-charcoal border border-ice/10 ml-0 mr-12 bos-surface bos-border'
										: 'bg-ink/60 border border-ice/12 ml-12 mr-0 bos-surface bos-border'}"
								>
									<!-- Sender Info -->
									<div class="flex items-center justify-between mb-2">
										<span
											class="text-sm font-medium {message.senderType === 'human'
												? 'text-white/85 bos-text'
												: 'text-ice/85 bos-text'}"
										>
											{message.senderName}
										</span>
										<span class="text-xs text-ice/60 bos-muted">
											{m.round()} {message.round} • {formatTime(message.timestamp)}
										</span>
									</div>

									<!-- Message Content -->
									<p class="text-white bos-text text-lg leading-relaxed">
										{message.content}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar styling */
	.history-scroll {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.22) rgba(255, 255, 255, 0.08);
	}

	.history-scroll::-webkit-scrollbar {
		width: 8px;
	}

	.history-scroll::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 4px;
	}

	.history-scroll::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.22);
		border-radius: 4px;
	}

	.history-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.32);
	}
</style>
