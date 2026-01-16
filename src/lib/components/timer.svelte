<script lang="ts">
	import { Hourglass } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';
	import tick_sound from '@/sounds/tick_sound.mp3';

	interface TimerProps {
		onTimeUp: () => void;
		duration?: number; // Duration in seconds, defaults to 2 minutes
	}

	let { onTimeUp, duration = 2 * 60 }: TimerProps = $props();

	let tickSound: HTMLAudioElement | null = null;

	onMount(() => {
		tickSound = new Audio(tick_sound); // Use your tick sound file
		tickSound.volume = 0.2;
	});

	// Use provided duration or default to 2 minutes
	let timerDuration = $derived.by(() => duration);
	let timeLeft = $state(duration);
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let isUnderOneMinute = $derived.by(() => timeLeft < 60);

	$effect(() => {
		// Reset timer when duration changes
		timeLeft = timerDuration;

		// Clear any existing interval
		if (intervalId) {
			clearInterval(intervalId);
		}

		if (!timerDuration) {
			return;
		}

		const updateTimeLeft = () => {
			timeLeft = Math.max(0, timeLeft - 1);

			if (timeLeft <= 60 && timeLeft > 0 && tickSound) {
				tickSound.play().catch((err) => console.error('Error playing warning sound:', err));
			}

			if (timeLeft <= 0) {
				if (tickSound) {
					tickSound.pause();
					tickSound.currentTime = 0;
				}
				if (intervalId) {
					clearInterval(intervalId);
					intervalId = null;
				}
				onTimeUp();
			}
		};

		// Set interval for updates
		intervalId = setInterval(updateTimeLeft, 1000);

		// Cleanup on unmount
		return () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};
	});

	let formattedTime = $derived.by(() => {
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
		if (tickSound) {
			tickSound.pause();
			tickSound.currentTime = 0;
		}
	});

	let progressWidth = $derived.by(() => {
		if (!timerDuration) return 0;
		return (timeLeft / timerDuration) * 100;
	});
	$inspect(timerDuration);
	$inspect(timeLeft);
</script>

<div class="relative flex flex-grow items-center justify-center gap-3">
	<span class="hourglass-animation {isUnderOneMinute ? 'flash-text' : 'text-dark-green'}">
		<Hourglass strokeWidth={2.5} absoluteStrokeWidth={true} size={24} />
	</span>
	<p class="text-xl font-bold text-left {isUnderOneMinute ? 'flash-time' : 'text-dark-green'}">
		{formattedTime}
	</p>
	<div class="relative flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
		<div
			class="absolute top-0 left-0 h-full bg-dark-green transition-all duration-1000 ease-linear {isUnderOneMinute
				? 'flash-bg'
				: ''}"
			style="width: {progressWidth}%"
		></div>
	</div>
</div>

<style>
	.hourglass-animation {
		display: inline-block;
		animation:
			flip-forward 0.5s,
			flip-back 1s;
		animation-delay: 0s, 1s;
		animation-iteration-count: infinite;
	}

	@keyframes flip-forward {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(180deg);
		}
	}

	@keyframes flip-back {
		from {
			transform: rotate(180deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.flash-bg {
		animation: flash-background 1s ease-in-out infinite;
	}

	@keyframes flash-background {
		0%,
		100% {
			background-color: rgb(39, 97, 63);
		}
		50% {
			background-color: rgb(255, 97, 87);
		}
	}
	.flash-text {
		animation:
			flip-forward 0.5s infinite,
			flip-back 1s infinite,
			flash-color 1s ease-in-out infinite;
		animation-delay: 0s, 1s, 0s;
	}

	.flash-time {
		animation: flash-color 1s ease-in-out infinite;
	}

	@keyframes flash-color {
		0%,
		100% {
			color: rgb(39, 97, 63);
		}
		50% {
			color: rgb(255, 97, 87);
		}
	}
</style>
