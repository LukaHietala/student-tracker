export function formatForReading(seconds) {
	return seconds < 0
		? `Ylitöitä tehty: ${secondsToHuman(seconds)}`
		: `Töitä jäljellä: ${secondsToHuman(seconds)}`;
}

export function secondsToHuman(seconds) {
	const hours = Math.floor(Math.abs(seconds) / 3600);
	const minutes = Math.floor((Math.abs(seconds) % 3600) / 60);
	return `${hours} t ${minutes} min`;
}
