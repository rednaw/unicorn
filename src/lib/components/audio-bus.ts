// Module-level coordinator: only one <AudioPlayer> may play at a time.
// Whichever player claims the bus pauses whatever was playing before.
// Variants that use raw <audio> elements (/atelier) bypass this
// intentionally — they want simultaneous playback for cross-fade / proximity.

let active: HTMLAudioElement | null = null;

export function claim(el: HTMLAudioElement): void {
	if (active && active !== el) {
		active.pause();
	}
	active = el;
}

export function release(el: HTMLAudioElement): void {
	if (active === el) active = null;
}
