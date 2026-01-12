<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Hourglass } from 'lucide-svelte';

	interface DigitalClockProps {
		currentRound: number;
	}

	let { currentRound }: DigitalClockProps = $props();

	let currentTime = $state('');
	let timeIntervalId: ReturnType<typeof setInterval> | null = null;
	
	// Round timer (2 minutes = 120 seconds)
	const ROUND_TIMER_DURATION = 120; // 2 minutes in seconds
	let roundTimerStart = $state<number | null>(null);
	let timeLeft = $state(ROUND_TIMER_DURATION);
	let timerIntervalId: ReturnType<typeof setInterval> | null = null;
	let previousRound = $state(0);

	function updateTime() {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const seconds = now.getSeconds().toString().padStart(2, '0');
		currentTime = `${hours}:${minutes}:${seconds}`;
	}

	function startRoundTimer() {
		roundTimerStart = Date.now();
		timeLeft = ROUND_TIMER_DURATION;
		
		if (timerIntervalId) {
			clearInterval(timerIntervalId);
		}
		
		timerIntervalId = setInterval(() => {
			if (roundTimerStart) {
				const now = Date.now();
				const elapsedSeconds = Math.floor((now - roundTimerStart) / 1000);
				timeLeft = Math.max(0, ROUND_TIMER_DURATION - elapsedSeconds);
				
				if (timeLeft <= 0) {
					clearInterval(timerIntervalId!);
					timerIntervalId = null;
				}
			}
		}, 1000);
	}

	// Reset timer when round changes
	$effect(() => {
		if (currentRound !== previousRound && currentRound > 0) {
			previousRound = currentRound;
			startRoundTimer();
		}
	});

	onMount(() => {
		updateTime(); // Initial update
		timeIntervalId = setInterval(updateTime, 1000); // Update every second
		startRoundTimer(); // Start round timer
	});

	onDestroy(() => {
		if (timeIntervalId) {
			clearInterval(timeIntervalId);
		}
		if (timerIntervalId) {
			clearInterval(timerIntervalId);
		}
	});

	const formattedTimer = $derived.by(() => {
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	});

	const isUnderOneMinute = $derived.by(() => timeLeft < 60);
	const progressWidth = $derived.by(() => (timeLeft / ROUND_TIMER_DURATION) * 100);
</script>

<div class="digital-clock flex flex-col gap-2">
	<!-- Round Timer (on top) -->
	<div class="bg-white rounded-lg shadow-lg border-2 border-dark-green px-3 py-2 flex flex-col gap-1">
		<div class="flex items-center justify-center gap-2">
			<span class="hourglass-animation {isUnderOneMinute ? 'flash-text' : 'text-dark-green'}">
				<Hourglass strokeWidth={2.5} absoluteStrokeWidth={true} size={16} />
			</span>
			<p class="text-sm font-bold {isUnderOneMinute ? 'flash-time' : 'text-dark-green'}">
				{formattedTimer}
			</p>
		</div>
		<div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
			<div
				class="absolute top-0 left-0 h-full bg-dark-green transition-all duration-1000 ease-linear {isUnderOneMinute
					? 'flash-bg'
					: ''}"
				style="width: {progressWidth}%"
			></div>
		</div>
	</div>
	
	<!-- Digital Clock (below) -->
	<div class="bg-white rounded-lg shadow-lg border-2 border-dark-green px-4 py-3 flex items-center justify-center">
		<div class="font-mono text-2xl md:text-3xl font-bold text-dark-green tabular-nums">
			{currentTime}
		</div>
	</div>
</div>

<style>
	.tabular-nums {
		font-variant-numeric: tabular-nums;
	}

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

