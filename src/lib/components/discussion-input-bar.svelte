<script lang="ts">
	import { MessageSquare, Send } from 'lucide-svelte';
	import { m } from '@src/paraglide/messages';

	interface DiscussionInputBarProps {
		onSend: (message: string) => void;
		onOpenHistory: () => void;
		disabled?: boolean;
	}

	let { onSend, onOpenHistory, disabled = false }: DiscussionInputBarProps = $props();

	let message = $state('');

	function handleSend() {
		if (message.trim() && !disabled) {
			onSend(message.trim());
			message = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<!-- Discussion Input Bar -->
<div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(900px,calc(100vw-2rem))] z-50 pointer-events-auto">
	<div class="relative">
		<!-- Background bar with shadow -->
		<div class="bg-gradient-to-b from-[#3a3a3a] to-[#2f2f2f] rounded-full px-6 py-5 shadow-2xl border border-white/10">
			<div class="flex items-center gap-4">
				<!-- History Button -->
				<button
					onclick={onOpenHistory}
					disabled={disabled}
					class="flex-shrink-0 w-14 h-14 rounded-full bg-[#3f3f3f] hover:bg-[#4a4a4a] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label={m.open_message_history()}
				>
					<MessageSquare class="w-6 h-6 text-white" />
				</button>

				<!-- Divider -->
				<div class="h-12 w-px bg-white/10"></div>

				<!-- Input Field -->
				<input
					type="text"
					bind:value={message}
					onkeydown={handleKeydown}
					disabled={disabled}
					placeholder={m.discussion_input_placeholder()}
					class="flex-1 bg-transparent text-white text-lg placeholder:text-[#d8d8d8]/65 outline-none disabled:opacity-50"
				/>

				<!-- Send Button -->
				<button
					onclick={handleSend}
					disabled={disabled || !message.trim()}
					class="flex-shrink-0 w-16 h-16 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
					aria-label={m.send_message()}
				>
					<Send class="w-7 h-7 text-[#1f1f1f]" />
				</button>
			</div>
		</div>
	</div>
</div>

