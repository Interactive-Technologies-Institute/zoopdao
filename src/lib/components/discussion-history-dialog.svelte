<script lang="ts">
	import { X } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { getDiscussionMessages } from '@/utils/discussion-messages';

	interface Message {
		id: string;
		content: string;
		senderType: 'human' | 'ai';
		senderName: string;
		round: number;
		timestamp: Date;
	}

	interface DiscussionHistoryDialogProps {
		open: boolean;
		gameId: number;
		supabase: SupabaseClient;
		onClose: () => void;
	}

	let { open = $bindable(), gameId, supabase, onClose }: DiscussionHistoryDialogProps = $props();

	let messages = $state<Message[]>([]);
	let isLoading = $state(false);

	// Load messages from database when dialog opens
	$effect(() => {
		if (open && gameId) {
			isLoading = true;
			getDiscussionMessages(supabase, gameId)
				.then((dbMessages) => {
					// Convert database messages to dialog format
					messages = dbMessages.map((msg) => ({
						id: msg.id.toString(),
						content: msg.content,
						senderType: msg.participantType === 'human' ? 'human' : 'ai',
						senderName: msg.participantType === 'human' 
							? 'Participant' 
							: (msg.agentRole 
								? msg.agentRole.charAt(0).toUpperCase() + msg.agentRole.slice(1) 
								: 'AI Agent'),
						round: msg.round,
						timestamp: new Date(msg.createdAt)
					}));
				})
				.catch((error) => {
					console.error('Error loading discussion messages:', error);
					messages = [];
				})
				.finally(() => {
					isLoading = false;
				});
		}
	});

	function handleClose() {
		open = false;
		onClose();
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
		onclick={handleClose}
		role="button"
		tabindex="0"
	>
		<!-- Dialog Panel -->
		<div
			class="w-full max-w-[860px] max-h-[700px] bg-gradient-to-b from-[#2f2f2f] to-[#242424] rounded-3xl shadow-2xl border border-white/10 flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="history-title"
		>
			<!-- Header -->
			<div class="bg-gradient-to-r from-[#3a3a3a] to-[#2d2d2d] rounded-t-3xl px-8 py-6 border-b border-white/10 flex items-center justify-between">
				<h2 id="history-title" class="text-2xl font-semibold text-[#f2f2f2]/90">
					{m.message_history()}
				</h2>
				
				<!-- Close Button -->
				<button
					onclick={handleClose}
					class="w-11 h-11 rounded-full bg-[#3f3f3f] hover:bg-[#4a4a4a] transition-colors flex items-center justify-center border border-white/10"
					aria-label={m.close()}
				>
					<X class="w-6 h-6 text-white/90" />
				</button>
			</div>

			<!-- Scrollable Content Area -->
			<div class="flex-1 p-8 overflow-y-auto">
				<div class="bg-[#1f1f1f]/65 rounded-2xl p-6 border border-white/8 min-h-[520px]">
					{#if isLoading}
						<div class="flex items-center justify-center h-full text-white/50">
							<p class="text-lg">Loading messages...</p>
						</div>
					{:else if messages.length === 0}
						<div class="flex items-center justify-center h-full text-white/50">
							<p class="text-lg">{m.no_messages_yet()}</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each messages as message (message.id)}
								<div
									class="rounded-2xl p-6 shadow-lg {message.senderType === 'human'
										? 'bg-[#353535] border border-white/10 ml-0 mr-12'
										: 'bg-[#2a3a3d] border border-[#c8fbff]/12 ml-12 mr-0'}"
								>
									<!-- Sender Info -->
									<div class="flex items-center justify-between mb-2">
										<span
											class="text-sm font-medium {message.senderType === 'human'
												? 'text-[#eaeaea]/85'
												: 'text-[#c8fbff]/85'}"
										>
											{message.senderName}
										</span>
										<span class="text-xs text-white/50">
											Round {message.round} • {formatTime(message.timestamp)}
										</span>
									</div>

									<!-- Message Content -->
									<p class="text-white/92 text-lg leading-relaxed">
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

