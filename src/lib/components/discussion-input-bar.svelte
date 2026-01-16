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
<div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[760px] z-50 pointer-events-auto">
	<div class="relative">
		<!-- Background bar with shadow -->
		<div class="bg-gradient-to-b from-[#3a3a3a] to-[#2f2f2f] rounded-full px-4 py-3 sm:px-5 sm:py-4 shadow-2xl border border-white/10">
			<div class="flex items-center gap-3 sm:gap-4">
				<!-- History Button -->
				<button
					onclick={onOpenHistory}
					disabled={disabled}
					class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3f3f3f] hover:bg-[#4a4a4a] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label={m.open_message_history()}
				>
					<MessageSquare class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
				</button>

				<!-- Divider -->
				<div class="h-8 sm:h-10 w-px bg-white/10"></div>

				<!-- Input Field -->
				<input
					type="text"
					bind:value={message}
					onkeydown={handleKeydown}
					disabled={disabled}
					placeholder={m.discussion_input_placeholder()}
					class="flex-1 bg-transparent text-white text-base sm:text-lg placeholder:text-[#d8d8d8]/65 outline-none disabled:opacity-50"
				/>

				<!-- Send Button -->
				<button
					onclick={handleSend}
					disabled={disabled || !message.trim()}
					class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
					aria-label={m.send_message()}
				>
					<Send class="w-5 h-5 sm:w-6 sm:h-6 text-[#1f1f1f]" />
				</button>
			</div>
		</div>
	</div>
</div>
