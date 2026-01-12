<script lang="ts">
	// Simple typing indicator with 3 dots
</script>

<div class="flex items-center gap-1">
	<span class="typing-dot"></span>
	<span class="typing-dot"></span>
	<span class="typing-dot"></span>
</div>

<style>
	.typing-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #3b82f6;
		animation: typing-bounce 1.4s infinite ease-in-out;
	}

	.typing-dot:nth-child(1) {
		animation-delay: 0s;
	}

	.typing-dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing-bounce {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.7;
		}
		30% {
			transform: translateY(-8px);
			opacity: 1;
		}
	}
</style>

