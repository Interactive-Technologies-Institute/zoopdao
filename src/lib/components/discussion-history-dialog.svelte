<script lang="ts">
	import { X } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';

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
		return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
		on:click={handleClose}
		role="button"
		tabindex="0"
	>
		<!-- Dialog Panel -->
		<div
			class="w-full max-w-[860px] max-h-[700px] bg-gradient-to-b from-dark-deep to-midnight bos-surface rounded-3xl shadow-2xl border border-ice/15 bos-border flex flex-col"
			on:click={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="history-title"
		>
			<!-- Header -->
			<div class="bg-gradient-to-r from-charcoal to-graphite bos-surface rounded-t-3xl px-8 py-6 border-b border-ice/15 bos-border flex items-center justify-between">
				<h2 id="history-title" class="text-2xl font-semibold text-white bos-text">
					{m.message_history()}
				</h2>
				
				<!-- Close Button -->
				<button
					on:click={handleClose}
					class="w-11 h-11 rounded-full bg-charcoal hover:bg-tertiary/40 transition-colors flex items-center justify-center border border-ice/20 bos-surface bos-border bos-text"
					aria-label={m.close()}
				>
					<X class="w-6 h-6 text-white bos-text" />
				</button>
			</div>

			<!-- Scrollable Content Area -->
			<div class="flex-1 p-8 overflow-y-auto">
				<div class="bg-dark-deep/70 bos-surface rounded-2xl p-6 border border-ice/10 bos-border min-h-[520px]">
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
											Round {message.round} • {formatTime(message.timestamp)}
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
	:global(.overflow-y-auto) {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.22) rgba(255, 255, 255, 0.08);
	}

	:global(.overflow-y-auto::-webkit-scrollbar) {
		width: 8px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 4px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background: rgba(255, 255, 255, 0.22);
		border-radius: 4px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background: rgba(255, 255, 255, 0.32);
	}
</style>
