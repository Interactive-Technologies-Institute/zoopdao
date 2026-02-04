export const SOUNDS_ENABLED = false;

export function createAudio(src: string, volume = 1): HTMLAudioElement | null {
	if (!SOUNDS_ENABLED) return null;
	const audio = new Audio(src);
	audio.volume = volume;
	return audio;
}

export function playAudio(audio: HTMLAudioElement | null | undefined, opts?: { reset?: boolean }) {
	if (!SOUNDS_ENABLED) return;
	if (!audio) return;

	if (opts?.reset !== false) {
		try {
			audio.currentTime = 0;
		} catch {
			// ignore
		}
	}

	try {
		void audio.play();
	} catch {
		// ignore
	}
}
