export type ListeningPhase = 'playing' | 'paused' | 'ended';

/**
 * Tap-focus session: which piece the visitor is listening to and whether
 * the recording is playing or finished. Drives HUD, plaque, and view transition.
 */
export function createListening() {
	let drawingId = $state<string | null>(null);
	let phase = $state<ListeningPhase | null>(null);

	function focus(id: string) {
		drawingId = id;
		phase = 'playing';
	}

	function markEnded() {
		if (drawingId !== null && phase === 'playing') {
			phase = 'ended';
		}
	}

	function pause() {
		if (drawingId !== null && phase === 'playing') {
			phase = 'paused';
		}
	}

	function resume() {
		if (drawingId !== null && phase === 'paused') {
			phase = 'playing';
		}
	}

	function clear() {
		drawingId = null;
		phase = null;
	}

	function isPlaying(id: string): boolean {
		return drawingId === id && phase === 'playing';
	}

	return {
		get drawingId() {
			return drawingId;
		},
		get phase() {
			return phase;
		},
		get focusedId() {
			return drawingId;
		},
		get hudDrawingId() {
			return drawingId;
		},
		get hudEnded() {
			return phase === 'ended';
		},
		focus,
		markEnded,
		pause,
		resume,
		clear,
		isPlaying
	};
}

export type Listening = ReturnType<typeof createListening>;
